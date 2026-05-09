package com.rideplatform.matching.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Slf4j
@Component
public class SurgeClient {

    private final RestTemplate restTemplate;

    @Value("${surge.service.url:http://localhost:8083}")
    private String surgeServiceUrl;

    public SurgeClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Fetch current surge multiplier for a pickup coordinate.
     * Falls back to 1.0 (no surge) on any error — never block a match.
     */
    public double getMultiplier(double lat, double lng) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(surgeServiceUrl + "/v1/surge")
                    .queryParam("lat", lat)
                    .queryParam("lng", lng)
                    .toUriString();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("multiplier")) {
                return ((Number) response.get("multiplier")).doubleValue();
            }
        } catch (Exception e) {
            log.warn("Surge service unavailable, defaulting to 1.0: {}", e.getMessage());
        }
        return 1.0;
    }
}
