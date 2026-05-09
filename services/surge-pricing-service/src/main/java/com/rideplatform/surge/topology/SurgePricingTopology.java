package com.rideplatform.surge.topology;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.rideplatform.surge.geo.Geohash;
import com.rideplatform.surge.model.SurgeEvent;
import com.rideplatform.surge.model.ZoneMetrics;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.*;
import org.apache.kafka.streams.state.QueryableStoreTypes;
import org.apache.kafka.streams.state.ReadOnlyKeyValueStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.StreamsBuilderFactoryBean;

import java.time.Duration;
import java.util.List;

@Slf4j
@Configuration
public class SurgePricingTopology {

    private static final String TOPIC_LOCATION   = "driver.location.updates";
    private static final String TOPIC_TRIP_REQ   = "trip.requests";
    private static final String TOPIC_SURGE_OUT  = "surge.pricing.events";
    public  static final String STORE_SURGE      = "surge-multiplier-store";

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${surge.geohash-precision:5}")
    private int geohashPrecision;

    @Value("${surge.window-size-minutes:5}")
    private int windowMinutes;

    // Surge thresholds: ratio → multiplier (ordered ascending by ratio)
    private static final double[][] THRESHOLDS = {
        {1.5, 1.2},
        {2.0, 1.5},
        {3.0, 2.0},
        {5.0, 3.0}
    };

    @Bean
    public KStream<String, String> surgeStream(StreamsBuilder builder) {

        Duration window = Duration.ofMinutes(windowMinutes);

        // ── 1. SUPPLY stream ─────────────────────────────────────────────
        // Source: driver location pings → key by geohash zone
        KStream<String, String> locationStream = builder.stream(
                TOPIC_LOCATION,
                Consumed.with(Serdes.String(), Serdes.String()));

        // Count available drivers per zone in a tumbling window
        KTable<Windowed<String>, Long> supplyByZone = locationStream
                .filter((driverId, payload) -> isAvailableDriver(payload))
                .selectKey((driverId, payload) -> extractZone(payload))
                .groupByKey(Grouped.with(Serdes.String(), Serdes.String()))
                .windowedBy(TimeWindows.ofSizeWithNoGrace(window))
                .count(Materialized.as("supply-by-zone-store"));

        // ── 2. DEMAND stream ─────────────────────────────────────────────
        // Source: trip requests → key by pickup geohash zone
        KStream<String, String> tripStream = builder.stream(
                TOPIC_TRIP_REQ,
                Consumed.with(Serdes.String(), Serdes.String()));

        KTable<Windowed<String>, Long> demandByZone = tripStream
                .selectKey((riderId, payload) -> extractZoneFromTrip(payload))
                .groupByKey(Grouped.with(Serdes.String(), Serdes.String()))
                .windowedBy(TimeWindows.ofSizeWithNoGrace(window))
                .count(Materialized.as("demand-by-zone-store"));

        // ── 3. JOIN supply + demand → compute surge ───────────────────────
        // Convert windowed KTables to streams for joining
        KStream<String, Long> supplyStream = supplyByZone
                .toStream()
                .selectKey((windowed, count) -> windowed.key());

        KStream<String, Long> demandStream = demandByZone
                .toStream()
                .selectKey((windowed, count) -> windowed.key());

        // Re-group as KTables keyed by zone for join
        KTable<String, Long> latestSupply = supplyStream
                .groupByKey(Grouped.with(Serdes.String(), Serdes.Long()))
                .reduce((a, b) -> b, Materialized.as("latest-supply-store"));

        KTable<String, Long> latestDemand = demandStream
                .groupByKey(Grouped.with(Serdes.String(), Serdes.Long()))
                .reduce((a, b) -> b, Materialized.as("latest-demand-store"));

        // Join demand + supply → surge event
        KTable<String, String> surgeTable = latestDemand
                .leftJoin(latestSupply,
                        (demand, supply) -> computeSurge(demand, supply),
                        Materialized.<String, String>as(STORE_SURGE)
                                .withKeySerde(Serdes.String())
                                .withValueSerde(Serdes.String()));

        // ── 4. Publish surge events downstream ───────────────────────────
        KStream<String, String> surgeStream = surgeTable.toStream();
        surgeStream.to(TOPIC_SURGE_OUT, Produced.with(Serdes.String(), Serdes.String()));

        surgeStream.foreach((zone, surgeJson) ->
                log.info("Surge update zone={} payload={}", zone, surgeJson));

        return surgeStream;
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private boolean isAvailableDriver(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            // location pings from active drivers are implicitly "available"
            // a separate status field would be added in production
            return node.has("lat") && node.has("lng");
        } catch (Exception e) {
            return false;
        }
    }

    private String extractZone(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            double lat = node.get("lat").asDouble();
            double lng = node.get("lng").asDouble();
            return Geohash.encode(lat, lng, geohashPrecision);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String extractZoneFromTrip(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            double lat = node.get("pickup_lat").asDouble();
            double lng = node.get("pickup_lng").asDouble();
            return Geohash.encode(lat, lng, geohashPrecision);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String computeSurge(Long demand, Long supply) {
        long d = demand == null ? 0 : demand;
        long s = supply == null ? 1 : Math.max(supply, 1); // avoid div by zero

        double ratio = (double) d / s;
        double multiplier = 1.0;

        for (double[] threshold : THRESHOLDS) {
            if (ratio >= threshold[0]) {
                multiplier = threshold[1];
            }
        }

        try {
            ObjectNode node = mapper.createObjectNode();
            node.put("demand", d);
            node.put("supply", s);
            node.put("ratio", ratio);
            node.put("multiplier", multiplier);
            node.put("computed_at_ms", System.currentTimeMillis());
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{\"multiplier\":1.0}";
        }
    }
}
