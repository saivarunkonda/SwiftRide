package com.rideplatform.admin.controller;

import com.rideplatform.admin.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/v1/admin")
public class AdminController {

    private final AnalyticsService analyticsService;

    public AdminController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** GET /v1/admin/dashboard — flash card summary data */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    /** GET /v1/admin/surge-zones — top surge zones for heatmap */
    @GetMapping("/surge-zones")
    public ResponseEntity<List<Map<String, Object>>> surgeZones(
            @RequestParam(defaultValue = "60") int minutesBack) {
        Instant since = Instant.now().minus(minutesBack, ChronoUnit.MINUTES);
        return ResponseEntity.ok(analyticsService.getTopSurgeZones(since));
    }
}
