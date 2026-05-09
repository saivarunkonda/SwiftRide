package com.rideplatform.matching.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideplatform.matching.service.DriverIndexService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LocationEventConsumer {

    private final DriverIndexService driverIndexService;
    private final ObjectMapper objectMapper;

    public LocationEventConsumer(DriverIndexService driverIndexService, ObjectMapper objectMapper) {
        this.driverIndexService = driverIndexService;
        this.objectMapper = objectMapper;
    }

    /**
     * Consumes driver.location.updates from Kafka and indexes into Elasticsearch.
     * Same topic produced by the Go location-service.
     */
    @KafkaListener(topics = "driver.location.updates", groupId = "trip-matching-group")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode payload = objectMapper.readTree(record.value());

            String driverId = payload.get("driver_id").asText();
            double lat      = payload.get("lat").asDouble();
            double lng      = payload.get("lng").asDouble();
            double speed    = payload.has("speed") ? payload.get("speed").asDouble() : 0.0;
            double heading  = payload.has("heading") ? payload.get("heading").asDouble() : 0.0;

            driverIndexService.upsertDriver(driverId, lat, lng, speed, heading);
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process location event offset={} error={}",
                    record.offset(), e.getMessage());
            // don't ack — will be reprocessed (at-least-once)
        }
    }
}
