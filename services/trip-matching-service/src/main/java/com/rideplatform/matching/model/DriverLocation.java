package com.rideplatform.matching.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.GeoPointField;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "driver_locations")
public class DriverLocation {

    @Id
    private String driverId;

    // ES geo_point field — enables geo_distance queries
    @GeoPointField
    private GeoPoint location;

    @Field(type = FieldType.Double)
    private double speed;

    @Field(type = FieldType.Double)
    private double heading;

    @Field(type = FieldType.Keyword)
    private DriverStatus status;

    @Field(type = FieldType.Double)
    private double rating;

    @Field(type = FieldType.Date)
    private Instant lastUpdated;

    public enum DriverStatus {
        AVAILABLE, ON_TRIP, OFFLINE
    }
}
