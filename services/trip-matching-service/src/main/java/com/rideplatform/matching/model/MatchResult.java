package com.rideplatform.matching.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MatchResult {
    private String tripId;
    private String riderId;
    private List<DriverCandidate> candidates;
    private String status; // MATCHED, NO_DRIVERS_AVAILABLE
    private double surgeMultiplier;   // 1.0 = no surge
    private double estimatedFare;     // base fare * surge

    @Data
    @Builder
    public static class DriverCandidate {
        private String driverId;
        private double distanceKm;
        private double rating;
        private double etaMinutes;
        private double lat;
        private double lng;
    }
}
