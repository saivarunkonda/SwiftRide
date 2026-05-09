package com.rideplatform.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

@Configuration
public class SnsConfig {

    @Value("${aws.region}")
    private String region;

    @Bean
    public SnsClient snsClient() {
        // credentials resolved from env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
        // or IAM role when running on EKS (recommended — no static keys)
        return SnsClient.builder()
                .region(Region.of(region))
                .build();
    }
}
