package com.rideplatform.matching.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rideplatform.matching.model.Trip;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
public class TripStateService {

    private static final String KEY_PREFIX = "trip:";
    private static final Duration TRIP_TTL  = Duration.ofHours(24);

    private final StringRedisTemplate redis;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;

    public TripStateService(StringRedisTemplate redis,
                            KafkaTemplate<String, String> kafka,
                            ObjectMapper mapper) {
        this.redis  = redis;
        this.kafka  = kafka;
        this.mapper = mapper;
    }

    // ── state transitions ────────────────────────────────────────────────

    public Trip create(Trip trip) {
        trip.setStatus(Trip.TripStatus.REQUESTED);
        trip.setRequestedAt(Instant.now());
        save(trip);
        publishEvent(trip, "TRIP_REQUESTED");
        return trip;
    }

    public Trip match(String tripId, String driverId) {
        Trip trip = getOrThrow(tripId);
        assertStatus(trip, Trip.TripStatus.REQUESTED);

        trip.setDriverId(driverId);
        trip.setStatus(Trip.TripStatus.MATCHED);
        trip.setMatchedAt(Instant.now());
        save(trip);
        publishEvent(trip, "TRIP_MATCHED");
        return trip;
    }

    public Trip driverArriving(String tripId) {
        Trip trip = getOrThrow(tripId);
        assertStatus(trip, Trip.TripStatus.MATCHED);

        trip.setStatus(Trip.TripStatus.DRIVER_ARRIVING);
        trip.setDriverArrivingAt(Instant.now());
        save(trip);
        publishEvent(trip, "DRIVER_ARRIVING");
        return trip;
    }

    public Trip start(String tripId) {
        Trip trip = getOrThrow(tripId);
        assertStatus(trip, Trip.TripStatus.DRIVER_ARRIVING);

        trip.setStatus(Trip.TripStatus.IN_PROGRESS);
        trip.setStartedAt(Instant.now());
        save(trip);
        publishEvent(trip, "TRIP_STARTED");
        return trip;
    }

    public Trip complete(String tripId, double finalFare) {
        Trip trip = getOrThrow(tripId);
        assertStatus(trip, Trip.TripStatus.IN_PROGRESS);

        trip.setStatus(Trip.TripStatus.COMPLETED);
        trip.setFinalFare(finalFare);
        trip.setCompletedAt(Instant.now());
        save(trip);
        publishEvent(trip, "TRIP_COMPLETED");
        return trip;
    }

    public Trip cancel(String tripId) {
        Trip trip = getOrThrow(tripId);
        if (trip.getStatus() == Trip.TripStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed trip");
        }
        trip.setStatus(Trip.TripStatus.CANCELLED);
        save(trip);
        publishEvent(trip, "TRIP_CANCELLED");
        return trip;
    }

    // ── read ─────────────────────────────────────────────────────────────

    public Optional<Trip> get(String tripId) {
        String raw = redis.opsForValue().get(KEY_PREFIX + tripId);
        if (raw == null) return Optional.empty();
        try {
            return Optional.of(mapper.readValue(raw, Trip.class));
        } catch (Exception e) {
            log.error("Failed to deserialize trip {}: {}", tripId, e.getMessage());
            return Optional.empty();
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private void save(Trip trip) {
        try {
            redis.opsForValue().set(
                KEY_PREFIX + trip.getTripId(),
                mapper.writeValueAsString(trip),
                TRIP_TTL
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to save trip state: " + e.getMessage(), e);
        }
    }

    private Trip getOrThrow(String tripId) {
        return get(tripId).orElseThrow(() ->
            new IllegalArgumentException("Trip not found: " + tripId));
    }

    private void assertStatus(Trip trip, Trip.TripStatus expected) {
        if (trip.getStatus() != expected) {
            throw new IllegalStateException(
                String.format("Invalid transition: trip %s is %s, expected %s",
                    trip.getTripId(), trip.getStatus(), expected));
        }
    }

    private void publishEvent(Trip trip, String eventType) {
        try {
            String payload = mapper.writeValueAsString(java.util.Map.of(
                "type",      eventType,
                "trip_id",   trip.getTripId(),
                "rider_id",  trip.getRiderId(),
                "driver_id", trip.getDriverId() != null ? trip.getDriverId() : "",
                "status",    trip.getStatus().name(),
                "message",   buildMessage(eventType, trip)
            ));
            kafka.send("trip.events", trip.getTripId(), payload);
            log.info("Published {} for trip={}", eventType, trip.getTripId());
        } catch (Exception e) {
            log.error("Failed to publish trip event {}: {}", eventType, e.getMessage());
        }
    }

    private String buildMessage(String eventType, Trip trip) {
        return switch (eventType) {
            case "TRIP_MATCHED"    -> "Driver matched. ETA coming soon.";
            case "DRIVER_ARRIVING" -> "Your driver is arriving!";
            case "TRIP_STARTED"    -> "Trip started. Have a safe ride!";
            case "TRIP_COMPLETED"  -> String.format("Trip completed. Fare: $%.2f", trip.getFinalFare());
            case "TRIP_CANCELLED"  -> "Your trip was cancelled.";
            default                -> "";
        };
    }
}
