package com.rideplatform.matching.controller;

import com.rideplatform.matching.model.MatchResult;
import com.rideplatform.matching.model.TripRequest;
import com.rideplatform.matching.service.MatchingService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/v1/trips")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * POST /v1/trips/match
     * Rider requests a trip — returns ranked list of nearby available drivers.
     */
    @PostMapping("/match")
    public ResponseEntity<MatchResult> match(@Valid @RequestBody TripRequest request) {
        MatchResult result = matchingService.findDrivers(request);

        if ("NO_DRIVERS_AVAILABLE".equals(result.getStatus())) {
            return ResponseEntity.ok(result); // 200 with empty candidates, client handles UX
        }

        return ResponseEntity.ok(result);
    }
}
