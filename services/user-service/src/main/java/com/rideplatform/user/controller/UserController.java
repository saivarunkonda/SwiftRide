package com.rideplatform.user.controller;

import com.rideplatform.user.model.User;
import com.rideplatform.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // POST /v1/users/register — called after Cognito sign-up
    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest req,
                                          @AuthenticationPrincipal Jwt jwt) {
        String cognitoSub = jwt.getSubject();
        User user = userService.register(cognitoSub, req.getEmail(),
                req.getName(), req.getPhone(), req.getRole());
        return ResponseEntity.ok(user);
    }

    // GET /v1/users/me — current authenticated user
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getById(jwt.getSubject()));
    }

    // GET /v1/users/{id} — internal use (other services)
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @Data
    static class RegisterRequest {
        @NotBlank @Email private String email;
        @NotBlank        private String name;
                         private String phone;
        @NotNull         private User.Role role;
    }
}
