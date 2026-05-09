package com.rideplatform.matching.repository;

import com.rideplatform.matching.model.DriverLocation;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface DriverLocationRepository extends ElasticsearchRepository<DriverLocation, String> {
    // custom geo queries are in DriverSearchRepository (uses ElasticsearchOperations)
}
