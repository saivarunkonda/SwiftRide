package com.rideplatform.matching.service;

import com.rideplatform.matching.client.SurgeClient;
import com.rideplatform.matching.model.DriverLocation;
import com.rideplatform.matching.model.MatchResult;
import com.rideplatform.matching.model.TripRequest;
import com.rideplatform.matching.repository.DriverSearchRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class MatchingService {

    private static final double BASE_FARE_PER_KM = 1.5; // USD per km baseline

    private final DriverSearchRepository searchRepo;
    private final SurgeClient surgeClient;
    private final MeterRegistry meterRegistry;

    @Value("${matching.search-radius-km}")
    private double defaultRadiusKm;

    @Value("${matching.max-drivers-returned}")
    private int maxDrivers;

    public MatchingService(DriverSearchRepository searchRepo,
                           SurgeClient surgeClient,
                           MeterRegistry meterRegistry) {
        this.searchRepo = searchRepo;
        this.surgeClient = surgeClient;
        this.meterRegistry = meterRegistry;
    }

    public MatchResult findDrivers(TripRequest request) {
        double radius = request.getRadiusKm() != null ? request.getRadiusKm() : defaultRadiusKm;
        String tripId = UUID.randomUUID().toString();

        log.info("Matching trip={} rider={} pickup=({},{}) radius={}km",
                tripId, request.getRiderId(), request.getPickupLat(), request.getPickupLng(), radius);

        // fetch surge multiplier for pickup zone (non-blocking fallback to 1.0)
        double surge = surgeClient.getMultiplier(request.getPickupLat(), request.getPickupLng());

        List<SearchHit<DriverLocation>> hits = searchRepo.findNearbyAvailableDrivers(
                request.getPickupLat(), request.getPickupLng(), radius, maxDrivers);

        meterRegistry.counter("matching.requests.total").increment();

        if (hits.isEmpty()) {
            meterRegistry.counter("matching.no_drivers").increment();
            log.warn("No drivers found for trip={}", tripId);
            return MatchResult.builder()
                    .tripId(tripId)
                    .riderId(request.getRiderId())
                    .status("NO_DRIVERS_AVAILABLE")
                    .surgeMultiplier(surge)
                    .estimatedFare(0)
                    .candidates(List.of())
                    .build();
        }

        List<MatchResult.DriverCandidate> candidates = hits.stream()
                .map(hit -> toCandidate(hit, request.getPickupLat(), request.getPickupLng()))
                .toList();

        // estimate fare using closest driver distance + surge
        double tripDistKm = haversineKm(
                request.getPickupLat(), request.getPickupLng(),
                request.getDropoffLat(), request.getDropoffLng());
        double estimatedFare = Math.round(tripDistKm * BASE_FARE_PER_KM * surge * 100.0) / 100.0;

        meterRegistry.counter("matching.matched").increment();
        meterRegistry.gauge("matching.surge.multiplier", surge);

        log.info("trip={} surge={} estimatedFare=${}", tripId, surge, estimatedFare);

        return MatchResult.builder()
                .tripId(tripId)
                .riderId(request.getRiderId())
                .status("MATCHED")
                .surgeMultiplier(surge)
                .estimatedFare(estimatedFare)
                .candidates(candidates)
                .build();
    }

    private MatchResult.DriverCandidate toCandidate(SearchHit<DriverLocation> hit,
                                                     double pickupLat, double pickupLng) {
        DriverLocation driver = hit.getContent();
        double distKm = haversineKm(pickupLat, pickupLng,
                driver.getLocation().getLat(), driver.getLocation().getLon());

        // ETA estimate: distance / avg speed (25 km/h in city traffic)
        double etaMinutes = (distKm / 25.0) * 60.0;

        return MatchResult.DriverCandidate.builder()
                .driverId(driver.getDriverId())
                .distanceKm(Math.round(distKm * 100.0) / 100.0)
                .rating(driver.getRating())
                .etaMinutes(Math.round(etaMinutes * 10.0) / 10.0)
                .lat(driver.getLocation().getLat())
                .lng(driver.getLocation().getLon())
                .build();
    }

    // Haversine formula — accurate great-circle distance
    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
