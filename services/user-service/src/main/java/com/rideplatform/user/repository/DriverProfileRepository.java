package com.rideplatform.user.repository;

import com.rideplatform.user.model.DriverProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverProfileRepository extends JpaRepository<DriverProfile, String> {
    List<DriverProfile> findByOnboardingStatus(DriverProfile.OnboardingStatus status);
}
