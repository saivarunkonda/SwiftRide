package com.rideplatform.matching.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Trip lifecycle stored in Redis.
 * Key: trip:<tripId>
 * TTL: 24 hours
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trip {

    private String tripId;
    private String riderId;
    private String driverId;

    private double pickupLat;
    private double pickupLng;
    private double dropoffLat;
    private double dropoffLng;

    private TripStatus status;

    private double surgeMultiplier;
    private double estimatedFare;
    private double finalFare;

    private Instant requestedAt;
    private Instant matchedAt;
    private Instant driverArrivingAt;
    private Instant startedAt;
    private Instant completedAt;

    public enum TripStatus {
        REQUESTED,
        MATCHED,
        DRIVER_ARRIVING,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
}
