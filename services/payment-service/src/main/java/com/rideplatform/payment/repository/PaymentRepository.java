package com.rideplatform.payment.repository;

import com.rideplatform.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByTripId(String tripId);
}
