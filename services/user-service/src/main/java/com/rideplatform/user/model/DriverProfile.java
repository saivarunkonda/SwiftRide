package com.rideplatform.user.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "driver_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {

    @Id
    private String userId;          // FK → users.id

    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private String vehicleMake;

    @Column(nullable = false)
    private String vehicleModel;

    @Column(nullable = false)
    private int vehicleYear;

    @Column(nullable = false, unique = true)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;  // ECONOMY, COMFORT, XL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OnboardingStatus onboardingStatus = OnboardingStatus.PENDING;

    private String backgroundCheckId;   // third-party check reference
    private String documentsS3Key;      // S3 key for uploaded docs

    private Instant approvedAt;
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }

    public enum VehicleType    { ECONOMY, COMFORT, XL }
    public enum OnboardingStatus { PENDING, DOCUMENTS_SUBMITTED, BACKGROUND_CHECK, APPROVED, REJECTED }
}
