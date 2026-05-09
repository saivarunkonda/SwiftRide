package com.rideplatform.admin.service;

import com.rideplatform.admin.model.TripAnalytics;
import com.rideplatform.admin.repository.TripAnalyticsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AnalyticsService {

    private final TripAnalyticsRepository repo;

    public AnalyticsService(TripAnalyticsRepository repo) {
        this.repo = repo;
    }

    /** Dashboard summary — flash card data */
    public Map<String, Object> getDashboardSummary() {
        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant hourAgo    = Instant.now().minus(1, ChronoUnit.HOURS);

        Map<String, Object> summary = new HashMap<>();
        summary.put("tripsToday",        repo.countTripsSince(todayStart));
        summary.put("revenueToday",      repo.sumFareSince(todayStart));
        summary.put("tripsLastHour",     repo.countTripsSince(hourAgo));
        summary.put("activeTrips",       repo.countByStatus("IN_PROGRESS"));
        summary.put("completedToday",    repo.countByStatus("COMPLETED"));
        summary.put("cancelledToday",    repo.countByStatus("CANCELLED"));
        summary.put("avgMatchLatencyMs", repo.avgMatchLatencySince(hourAgo));
        summary.put("topSurgeZones",     getTopSurgeZones(hourAgo));
        return summary;
    }

    public List<Map<String, Object>> getTopSurgeZones(Instant since) {
        return repo.topSurgeZonesSince(since).stream().map(row -> {
            Map<String, Object> zone = new HashMap<>();
            zone.put("zoneId",      row[0]);
            zone.put("avgSurge",    row[1]);
            zone.put("tripCount",   row[2]);
            return zone;
        }).toList();
    }

    public void record(TripAnalytics analytics) {
        repo.save(analytics);
        log.debug("Recorded analytics for trip={}", analytics.getTripId());
    }
}
