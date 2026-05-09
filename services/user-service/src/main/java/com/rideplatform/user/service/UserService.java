package com.rideplatform.user.service;

import com.rideplatform.user.model.User;
import com.rideplatform.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User getById(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    @Transactional
    public User register(String cognitoSub, String email, String name,
                          String phone, User.Role role) {
        if (repo.findByEmail(email).isPresent()) {
            throw new IllegalStateException("Email already registered: " + email);
        }
        User user = User.builder()
                .id(cognitoSub)
                .email(email)
                .name(name)
                .phone(phone)
                .role(role)
                .build();
        log.info("Registering user id={} role={}", cognitoSub, role);
        return repo.save(user);
    }

    @Transactional
    public User updateStripeCustomerId(String userId, String stripeCustomerId) {
        User user = getById(userId);
        user.setStripeCustomerId(stripeCustomerId);
        return repo.save(user);
    }

    @Transactional
    public User updateRating(String userId, double newRating) {
        User user = getById(userId);
        // rolling average — in production use a proper weighted average
        user.setRating(Math.round(((user.getRating() + newRating) / 2.0) * 10.0) / 10.0);
        return repo.save(user);
    }
}
