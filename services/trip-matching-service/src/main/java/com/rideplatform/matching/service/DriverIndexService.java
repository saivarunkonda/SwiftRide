package com.rideplatform.matching.service;

import com.rideplatform.matching.model.DriverLocation;
import com.rideplatform.matching.repository.DriverLocationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
public class DriverIndexService {

    private final DriverLocationRepository driverRepo;

    public DriverIndexService(DriverLocationRepository driverRepo) {
        this.driverRepo = driverRepo;
    }

    /**
     * Upsert driver position into Elasticsearch.
     * Called by the Kafka consumer on every location event.
     */
    public void upsertDriver(String driverId, double lat, double lng,
                              double speed, double heading) {
        DriverLocation doc = DriverLocation.builder()
                .driverId(driverId)
                .location(new GeoPoint(lat, lng))
                .speed(speed)
                .heading(heading)
                .status(DriverLocation.DriverStatus.AVAILABLE)
                .rating(4.8) // placeholder — real rating comes from user service
                .lastUpdated(Instant.now())
                .build();

        driverRepo.save(doc);
        log.debug("Indexed driver={} at ({},{})", driverId, lat, lng);
    }

    /**
     * Mark driver offline if no ping received in the last 30 seconds.
     * Runs every 15 seconds.
     */
    @Scheduled(fixedDelay = 15_000)
    public void evictStaleDrivers() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.SECONDS);
        Iterable<DriverLocation> all = driverRepo.findAll();
        all.forEach(driver -> {
            if (driver.getLastUpdated().isBefore(cutoff)
                    && driver.getStatus() == DriverLocation.DriverStatus.AVAILABLE) {
                driver.setStatus(DriverLocation.DriverStatus.OFFLINE);
                driverRepo.save(driver);
                log.info("Driver {} marked OFFLINE (stale)", driver.getDriverId());
            }
        });
    }
}
