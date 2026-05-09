package com.rideplatform.user.service;

import com.rideplatform.user.model.DriverProfile;
import com.rideplatform.user.model.DriverProfile.OnboardingStatus;
import com.rideplatform.user.repository.DriverProfileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class DriverOnboardingService {

    private final DriverProfileRepository repo;
    private final KafkaTemplate<String, String> kafka;

    public DriverOnboardingService(DriverProfileRepository repo,
                                    KafkaTemplate<String, String> kafka) {
        this.repo  = repo;
        this.kafka = kafka;
    }

    @Transactional
    public DriverProfile submitApplication(String userId, String licenseNumber,
                                            String make, String model, int year,
                                            String plate, DriverProfile.VehicleType type) {
        DriverProfile profile = DriverProfile.builder()
                .userId(userId)
                .licenseNumber(licenseNumber)
                .vehicleMake(make)
                .vehicleModel(model)
                .vehicleYear(year)
                .licensePlate(plate)
                .vehicleType(type)
                .onboardingStatus(OnboardingStatus.DOCUMENTS_SUBMITTED)
                .build();

        repo.save(profile);
        publishOnboardingEvent(userId, "DRIVER_APPLICATION_SUBMITTED");
        log.info("Driver application submitted userId={}", userId);
        return profile;
    }

    @Transactional
    public DriverProfile startBackgroundCheck(String userId, String checkId) {
        DriverProfile profile = getOrThrow(userId);
        profile.setBackgroundCheckId(checkId);
        profile.setOnboardingStatus(OnboardingStatus.BACKGROUND_CHECK);
        repo.save(profile);
        publishOnboardingEvent(userId, "BACKGROUND_CHECK_STARTED");
        return profile;
    }

    @Transactional
    public DriverProfile approve(String userId) {
        DriverProfile profile = getOrThrow(userId);
        profile.setOnboardingStatus(OnboardingStatus.APPROVED);
        profile.setApprovedAt(Instant.now());
        repo.save(profile);
        publishOnboardingEvent(userId, "DRIVER_APPROVED");
        log.info("Driver approved userId={}", userId);
        return profile;
    }

    @Transactional
    public DriverProfile reject(String userId) {
        DriverProfile profile = getOrThrow(userId);
        profile.setOnboardingStatus(OnboardingStatus.REJECTED);
        repo.save(profile);
        publishOnboardingEvent(userId, "DRIVER_REJECTED");
        return profile;
    }

    public List<DriverProfile> getPending() {
        return repo.findByOnboardingStatus(OnboardingStatus.DOCUMENTS_SUBMITTED);
    }

    private DriverProfile getOrThrow(String userId) {
        return repo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found: " + userId));
    }

    private void publishOnboardingEvent(String userId, String eventType) {
        String payload = String.format(
                "{\"type\":\"%s\",\"user_id\":\"%s\",\"timestamp\":%d}",
                eventType, userId, System.currentTimeMillis());
        kafka.send("driver.onboarding.events", userId, payload);
    }
}
