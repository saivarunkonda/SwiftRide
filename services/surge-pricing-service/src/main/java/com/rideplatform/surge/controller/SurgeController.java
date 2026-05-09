package com.rideplatform.surge.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideplatform.surge.geo.Geohash;
import com.rideplatform.surge.topology.SurgePricingTopology;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StoreQueryParameters;
import org.apache.kafka.streams.state.QueryableStoreTypes;
import org.apache.kafka.streams.state.ReadOnlyKeyValueStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.config.StreamsBuilderFactoryBean;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/surge")
public class SurgeController {

    private final StreamsBuilderFactoryBean factoryBean;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${surge.geohash-precision:5}")
    private int geohashPrecision;

    public SurgeController(StreamsBuilderFactoryBean factoryBean) {
        this.factoryBean = factoryBean;
    }

    /**
     * GET /v1/surge?lat=37.77&lng=-122.41
     * Returns current surge multiplier for the zone containing the given coordinates.
     */
    @GetMapping
    public ResponseEntity<?> getSurge(@RequestParam double lat, @RequestParam double lng) {
        String zone = Geohash.encode(lat, lng, geohashPrecision);
        return getSurgeForZone(zone);
    }

    /**
     * GET /v1/surge/zone/{zoneId}
     * Returns current surge multiplier for a specific geohash zone.
     */
    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<?> getSurgeByZone(@PathVariable String zoneId) {
        return getSurgeForZone(zoneId);
    }

    private ResponseEntity<?> getSurgeForZone(String zone) {
        try {
            KafkaStreams streams = factoryBean.getKafkaStreams();
            if (streams == null || streams.state() != KafkaStreams.State.RUNNING) {
                return ResponseEntity.ok(Map.of("zone", zone, "multiplier", 1.0, "status", "streams_not_ready"));
            }

            ReadOnlyKeyValueStore<String, String> store = streams.store(
                    StoreQueryParameters.fromNameAndType(
                            SurgePricingTopology.STORE_SURGE,
                            QueryableStoreTypes.keyValueStore()));

            String raw = store.get(zone);
            if (raw == null) {
                // no data for zone = no surge
                return ResponseEntity.ok(Map.of("zone", zone, "multiplier", 1.0, "demand", 0, "supply", 0));
            }

            JsonNode node = mapper.readTree(raw);
            return ResponseEntity.ok(Map.of(
                    "zone",       zone,
                    "multiplier", node.get("multiplier").asDouble(),
                    "demand",     node.get("demand").asLong(),
                    "supply",     node.get("supply").asLong(),
                    "ratio",      node.get("ratio").asDouble()
            ));

        } catch (Exception e) {
            log.error("Error querying surge store for zone={}: {}", zone, e.getMessage());
            return ResponseEntity.ok(Map.of("zone", zone, "multiplier", 1.0));
        }
    }
}
