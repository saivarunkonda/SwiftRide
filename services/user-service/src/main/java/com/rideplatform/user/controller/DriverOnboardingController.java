package com.rideplatform.user.controller;

import com.rideplatform.user.model.DriverProfile;
import com.rideplatform.user.service.DriverOnboardingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/drivers/onboarding")
public class DriverOnboardingController {

    private final DriverOnboardingService onboardingService;

    public DriverOnboardingController(DriverOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    // POST /v1/drivers/onboarding/apply — driver submits application
    @PostMapping("/apply")
    public ResponseEntity<DriverProfile> apply(@Valid @RequestBody ApplicationRequest req,
                                                @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(onboardingService.submitApplication(
                jwt.getSubject(), req.getLicenseNumber(),
                req.getVehicleMake(), req.getVehicleModel(), req.getVehicleYear(),
                req.getLicensePlate(), req.getVehicleType()));
    }

    // GET /v1/drivers/onboarding/status — driver checks their status
    @GetMapping("/status")
    public ResponseEntity<DriverProfile> status(@AuthenticationPrincipal Jwt jwt) {
        return onboardingService.getPending().stream()
                .filter(p -> p.getUserId().equals(jwt.getSubject()))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoints
    @GetMapping("/pending")
    public ResponseEntity<List<DriverProfile>> pending() {
        return ResponseEntity.ok(onboardingService.getPending());
    }

    @PostMapping("/{userId}/approve")
    public ResponseEntity<DriverProfile> approve(@PathVariable String userId) {
        return ResponseEntity.ok(onboardingService.approve(userId));
    }

    @PostMapping("/{userId}/reject")
    public ResponseEntity<DriverProfile> reject(@PathVariable String userId) {
        return ResponseEntity.ok(onboardingService.reject(userId));
    }

    @Data
    static class ApplicationRequest {
        @NotBlank private String licenseNumber;
        @NotBlank private String vehicleMake;
        @NotBlank private String vehicleModel;
        @NotNull  private Integer vehicleYear;
        @NotBlank private String licensePlate;
        @NotNull  private DriverProfile.VehicleType vehicleType;
    }
}
