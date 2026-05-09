package com.rideplatform.payment.service;

import com.rideplatform.payment.model.Payment;
import com.rideplatform.payment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class PaymentService {

    private final PaymentRepository repo;
    private final KafkaTemplate<String, String> kafka;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    public PaymentService(PaymentRepository repo, KafkaTemplate<String, String> kafka) {
        this.repo = repo;
        this.kafka = kafka;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Idempotent — if a payment already exists for tripId, returns it without charging again.
     */
    @Transactional
    public Payment chargeForTrip(String tripId, String riderId, String driverId,
                                  BigDecimal amount, BigDecimal surgeMultiplier,
                                  String stripeCustomerId) {

        // idempotency check
        return repo.findByTripId(tripId).orElseGet(() -> {
            Payment payment = Payment.builder()
                    .tripId(tripId)
                    .riderId(riderId)
                    .driverId(driverId)
                    .amount(amount)
                    .surgeMultiplier(surgeMultiplier)
                    .currency("usd")
                    .status(Payment.PaymentStatus.PENDING)
                    .build();
            repo.save(payment);

            try {
                // amount in cents for Stripe
                long amountCents = amount.multiply(BigDecimal.valueOf(100))
                        .setScale(0, RoundingMode.HALF_UP).longValue();

                PaymentIntent intent = PaymentIntent.create(
                        PaymentIntentCreateParams.builder()
                                .setAmount(amountCents)
                                .setCurrency("usd")
                                .setCustomer(stripeCustomerId)
                                .setConfirm(true)
                                .setOffSession(true) // rider already set up payment method
                                .putMetadata("trip_id", tripId)
                                .putMetadata("rider_id", riderId)
                                .build()
                );

                payment.setStripePaymentIntentId(intent.getId());
                payment.setStatus(Payment.PaymentStatus.CAPTURED);
                repo.save(payment);

                publishPaymentEvent(payment, "PAYMENT_CAPTURED");
                log.info("Payment captured trip={} amount={} intent={}", tripId, amount, intent.getId());

            } catch (Exception e) {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason(e.getMessage());
                repo.save(payment);
                publishPaymentEvent(payment, "PAYMENT_FAILED");
                log.error("Payment failed trip={} error={}", tripId, e.getMessage());
            }

            return payment;
        });
    }

    @Transactional
    public Payment refund(String tripId) {
        Payment payment = repo.findByTripId(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for trip: " + tripId));

        if (payment.getStatus() != Payment.PaymentStatus.CAPTURED) {
            throw new IllegalStateException("Only captured payments can be refunded");
        }

        try {
            com.stripe.model.Refund.create(
                    com.stripe.param.RefundCreateParams.builder()
                            .setPaymentIntent(payment.getStripePaymentIntentId())
                            .build()
            );
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            repo.save(payment);
            publishPaymentEvent(payment, "PAYMENT_REFUNDED");
        } catch (Exception e) {
            log.error("Refund failed trip={} error={}", tripId, e.getMessage());
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }

        return payment;
    }

    private void publishPaymentEvent(Payment payment, String eventType) {
        String payload = String.format(
                "{\"type\":\"%s\",\"trip_id\":\"%s\",\"rider_id\":\"%s\",\"amount\":%s,\"status\":\"%s\"}",
                eventType, payment.getTripId(), payment.getRiderId(),
                payment.getAmount(), payment.getStatus());
        kafka.send("payment.events", payment.getTripId(), payload);
    }
}
