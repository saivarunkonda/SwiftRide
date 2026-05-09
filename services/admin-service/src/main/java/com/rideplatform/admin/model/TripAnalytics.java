package com.rideplatform.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Denormalized analytics record — written by Kafka consumer,
 * read by admin dashboard queries. Never updated, only inserted.
 */
@Entity
@Table(name = "trip_analytics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripAnalytics {

    @Id
    private String tripId;

    private String riderId;
    private String driverId;

    private String status;          // final status
    private String geohashZone;     // pickup zone

    private BigDecimal finalFare;
    private BigDecimal surgeMultiplier;

    private long matchLatencyMs;    // time from REQUESTED to MATCHED
    private long tripDurationMs;    // time from IN_PROGRESS to COMPLETED

    private Instant tripDate;       // for time-series queries
    private Instant recordedAt;

    @PrePersist
    void prePersist() { recordedAt = Instant.now(); }
}
