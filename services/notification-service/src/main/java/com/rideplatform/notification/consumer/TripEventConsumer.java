package com.rideplatform.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideplatform.notification.model.NotificationEvent;
import com.rideplatform.notification.service.SnsNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TripEventConsumer {

    private final SnsNotificationService snsService;
    private final ObjectMapper mapper;

    public TripEventConsumer(SnsNotificationService snsService, ObjectMapper mapper) {
        this.snsService = snsService;
        this.mapper = mapper;
    }

    /**
     * Listens to trip lifecycle events published by the trip-matching service.
     * Each event triggers the appropriate notification to rider and/or driver.
     *
     * Expected payload:
     * {
     *   "type": "TRIP_MATCHED",
     *   "trip_id": "...",
     *   "rider_id": "...",
     *   "driver_id": "...",
     *   "message": "..."
     * }
     */
    @KafkaListener(topics = "trip.events", groupId = "notification-group")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode payload = mapper.readTree(record.value());

            String type     = payload.get("type").asText();
            String tripId   = payload.get("trip_id").asText();
            String riderId  = payload.path("rider_id").asText(null);
            String driverId = payload.path("driver_id").asText(null);
            String message  = payload.path("message").asText("");

            // notify rider
            if (riderId != null) {
                NotificationEvent riderEvent = new NotificationEvent();
                riderEvent.setType(type);
                riderEvent.setTripId(tripId);
                riderEvent.setRecipientId(riderId);
                riderEvent.setRecipientType("RIDER");
                riderEvent.setMessage(message);
                snsService.send(riderEvent);
            }

            // notify driver on match
            if (driverId != null && "TRIP_MATCHED".equals(type)) {
                NotificationEvent driverEvent = new NotificationEvent();
                driverEvent.setType(type);
                driverEvent.setTripId(tripId);
                driverEvent.setRecipientId(driverId);
                driverEvent.setRecipientType("DRIVER");
                driverEvent.setMessage("New trip request assigned to you.");
                snsService.send(driverEvent);
            }

            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process trip event offset={} error={}", record.offset(), e.getMessage());
        }
    }
}
