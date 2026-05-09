package com.rideplatform.matching.repository;

import com.rideplatform.matching.model.DriverLocation;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DriverSearchRepository {

    private final ElasticsearchOperations esOps;

    public DriverSearchRepository(ElasticsearchOperations esOps) {
        this.esOps = esOps;
    }

    /**
     * Find available drivers within radiusKm of the given point,
     * ordered by distance ascending.
     */
    public List<SearchHit<DriverLocation>> findNearbyAvailableDrivers(
            double lat, double lng, double radiusKm, int maxResults) {

        GeoPoint center = new GeoPoint(lat, lng);
        Distance radius = new Distance(radiusKm, Metrics.KILOMETERS);

        Criteria criteria = new Criteria("location")
                .within(center, radius)
                .and("status").is(DriverLocation.DriverStatus.AVAILABLE);

        CriteriaQuery query = new CriteriaQuery(criteria);
        query.setMaxResults(maxResults);

        return esOps.search(query, DriverLocation.class)
                .getSearchHits();
    }
}
