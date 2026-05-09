package com.rideplatform.matching.controller;

import com.rideplatform.matching.model.Trip;
import com.rideplatform.matching.model.TripRequest;
import com.rideplatform.matching.model.MatchResult;
import com.rideplatform.matching.service.MatchingService;
import com.rideplatform.matching.service.TripStateService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/trips")
public class TripController {

    private final MatchingService matchingService;
    private final TripStateService tripStateService;

    public TripController(MatchingService matchingService, TripStateService tripStateService) {
        this.matchingService  = matchingService;
        this.tripStateService = tripStateService;
    }

    // POST /v1/trips/match — find drivers + create trip in REQUESTED state
    @PostMapping("/match")
    public ResponseEntity<MatchResult> match(@Valid @RequestBody TripRequest request) {
        MatchResult result = matchingService.findDrivers(request);

        // create trip state in Redis regardless of match outcome
        Trip trip = Trip.builder()
                .tripId(result.getTripId())
                .riderId(request.getRiderId())
                .pickupLat(request.getPickupLat())
                .pickupLng(request.getPickupLng())
                .dropoffLat(request.getDropoffLat())
                .dropoffLng(request.getDropoffLng())
                .surgeMultiplier(result.getSurgeMultiplier())
                .estimatedFare(result.getEstimatedFare())
                .build();
        tripStateService.create(trip);

        return ResponseEntity.ok(result);
    }

    // POST /v1/trips/{tripId}/accept — driver accepts, transition REQUESTED → MATCHED
    @PostMapping("/{tripId}/accept")
    public ResponseEntity<Trip> accept(@PathVariable String tripId,
                                       @RequestParam String driverId) {
        return ResponseEntity.ok(tripStateService.match(tripId, driverId));
    }

    // POST /v1/trips/{tripId}/arriving — driver is at pickup
    @PostMapping("/{tripId}/arriving")
    public ResponseEntity<Trip> arriving(@PathVariable String tripId) {
        return ResponseEntity.ok(tripStateService.driverArriving(tripId));
    }

    // POST /v1/trips/{tripId}/start — rider boards, trip begins
    @PostMapping("/{tripId}/start")
    public ResponseEntity<Trip> start(@PathVariable String tripId) {
        return ResponseEntity.ok(tripStateService.start(tripId));
    }

    // POST /v1/trips/{tripId}/complete
    @PostMapping("/{tripId}/complete")
    public ResponseEntity<Trip> complete(@PathVariable String tripId,
                                          @RequestParam double finalFare) {
        return ResponseEntity.ok(tripStateService.complete(tripId, finalFare));
    }

    // POST /v1/trips/{tripId}/cancel
    @PostMapping("/{tripId}/cancel")
    public ResponseEntity<Trip> cancel(@PathVariable String tripId) {
        return ResponseEntity.ok(tripStateService.cancel(tripId));
    }

    // GET /v1/trips/{tripId}
    @GetMapping("/{tripId}")
    public ResponseEntity<Trip> get(@PathVariable String tripId) {
        return tripStateService.get(tripId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
