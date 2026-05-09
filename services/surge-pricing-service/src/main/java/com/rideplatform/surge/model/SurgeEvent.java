package com.rideplatform.surge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurgeEvent {
    private String zoneId;
    private double multiplier;
    private long demandCount;
    private long supplyCount;
    private double demandSupplyRatio;
    private long computedAtMs;
}
