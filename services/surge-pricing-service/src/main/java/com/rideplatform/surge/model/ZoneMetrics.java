package com.rideplatform.surge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneMetrics {
    private String zoneId;       // geohash
    private long demandCount;    // trip requests in window
    private long supplyCount;    // available drivers in window
    private double surgeMultiplier;
    private long windowStartMs;
    private long windowEndMs;
}
