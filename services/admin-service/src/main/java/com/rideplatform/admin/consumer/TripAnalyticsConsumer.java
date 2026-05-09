package com.rideplatform.admin.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideplatform.admin.model.TripAnalytics;
import com.rideplatform.admin.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Component
public class TripAnalyticsConsumer {

    private final AnalyticsService analyticsService;
    private final ObjectMapper mapper;

    public TripAnalyticsConsumer(AnalyticsService analyticsService, ObjectMapper mapper) {
        this.analyticsService = analyticsService;
        this.mapper = mapper;
    }

    /**
     * Consumes trip.events and payment.events to build analytics records.
     * Only records on TRIP_COMPLETED to get final fare + full duration.
     */
    @KafkaListener(topics = {"trip.events", "payment.events"}, groupId = "admin-analytics-group")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode payload = mapper.readTree(record.value());
            String type = payload.path("type").asText("");

            // only record completed trips for analytics
            if ("TRIP_COMPLETED".equals(type) || "PAYMENT_CAPTURED".equals(type)) {
                TripAnalytics analytics = TripAnalytics.builder()
                        .tripId(payload.path("trip_id").asText())
                        .riderId(payload.path("rider_id").asText())
                        .driverId(payload.path("driver_id").asText(""))
                        .status(payload.path("status").asText("COMPLETED"))
                        .finalFare(new BigDecimal(payload.path("amount").asText("0")))
                        .surgeMultiplier(BigDecimal.valueOf(payload.path("surge_multiplier").asDouble(1.0)))
                        .tripDate(Instant.now())
                        .build();

                analyticsService.record(analytics);
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Analytics consumer error offset={}: {}", record.offset(), e.getMessage());
        }
    }
}
