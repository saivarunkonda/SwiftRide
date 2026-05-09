package com.rideplatform.user.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;              // Cognito sub (UUID)

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;              // RIDER, DRIVER

    // Stripe customer ID — stored here, used by payment-service
    private String stripeCustomerId;

    @Column(nullable = false)
    @Builder.Default
    private double rating = 5.0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }

    public enum Role { RIDER, DRIVER, ADMIN }
}
