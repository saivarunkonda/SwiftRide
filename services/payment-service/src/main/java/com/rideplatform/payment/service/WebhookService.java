package com.rideplatform.payment.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class WebhookService {

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    /**
     * Verifies Stripe webhook signature and handles relevant events.
     * Stripe sends async confirmations here — e.g. payment_intent.succeeded
     */
    public void handle(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature");
            throw new SecurityException("Invalid webhook signature");
        }

        log.info("Stripe webhook received type={} id={}", event.getType(), event.getId());

        switch (event.getType()) {
            case "payment_intent.succeeded" ->
                log.info("PaymentIntent succeeded: {}", event.getId());
            case "payment_intent.payment_failed" ->
                log.warn("PaymentIntent failed: {}", event.getId());
            case "charge.dispute.created" ->
                log.warn("Dispute created for charge in event: {}", event.getId());
            default ->
                log.debug("Unhandled Stripe event type: {}", event.getType());
        }
    }
}
