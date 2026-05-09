package com.rideplatform.matching.model;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class TripRequest {

    @NotBlank
    private String riderId;

    @NotNull
    private double pickupLat;

    @NotNull
    private double pickupLng;

    @NotNull
    private double dropoffLat;

    @NotNull
    private double dropoffLng;

    // optional — override default search radius
    private Double radiusKm;
}
