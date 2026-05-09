package com.rideplatform.admin.repository;

import com.rideplatform.admin.model.TripAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface TripAnalyticsRepository extends JpaRepository<TripAnalytics, String> {

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(t.finalFare), 0) FROM TripAnalytics t WHERE t.tripDate >= :since")
    BigDecimal sumFareSince(@Param("since") Instant since);

    @Query("SELECT COUNT(t) FROM TripAnalytics t WHERE t.tripDate >= :since")
    long countTripsSince(@Param("since") Instant since);

    @Query("SELECT t.geohashZone, AVG(t.surgeMultiplier) as avgSurge, COUNT(t) as tripCount " +
           "FROM TripAnalytics t WHERE t.tripDate >= :since " +
           "GROUP BY t.geohashZone ORDER BY avgSurge DESC")
    List<Object[]> topSurgeZonesSince(@Param("since") Instant since);

    @Query("SELECT AVG(t.matchLatencyMs) FROM TripAnalytics t WHERE t.tripDate >= :since")
    Double avgMatchLatencySince(@Param("since") Instant since);
}
