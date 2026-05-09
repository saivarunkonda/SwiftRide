package com.rideplatform.payment.controller;

import com.rideplatform.payment.model.Payment;
import com.rideplatform.payment.service.PaymentService;
import com.rideplatform.payment.service.WebhookService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@Slf4j
@RestController
@RequestMapping("/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final WebhookService webhookService;

    public PaymentController(PaymentService paymentService, WebhookService webhookService) {
        this.paymentService = paymentService;
        this.webhookService = webhookService;
    }

    // POST /v1/payments/charge
    @PostMapping("/charge")
    public ResponseEntity<Payment> charge(@Valid @RequestBody ChargeRequest req) {
        Payment payment = paymentService.chargeForTrip(
                req.getTripId(), req.getRiderId(), req.getDriverId(),
                req.getAmount(), req.getSurgeMultiplier(), req.getStripeCustomerId());
        return ResponseEntity.ok(payment);
    }

    // POST /v1/payments/{tripId}/refund
    @PostMapping("/{tripId}/refund")
    public ResponseEntity<Payment> refund(@PathVariable String tripId) {
        return ResponseEntity.ok(paymentService.refund(tripId));
    }

    // POST /v1/payments/webhook  — Stripe webhook endpoint
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        webhookService.handle(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    @Data
    static class ChargeRequest {
        @NotBlank private String tripId;
        @NotBlank private String riderId;
        @NotBlank private String driverId;
        @NotNull  private BigDecimal amount;
        @NotNull  private BigDecimal surgeMultiplier;
        @NotBlank private String stripeCustomerId;
    }
}
