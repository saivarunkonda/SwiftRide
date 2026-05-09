package com.rideplatform.matching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TripMatchingApplication {
    public static void main(String[] args) {
        SpringApplication.run(TripMatchingApplication.class, args);
    }
}
