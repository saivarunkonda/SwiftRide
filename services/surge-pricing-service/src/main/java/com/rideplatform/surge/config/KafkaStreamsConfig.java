package com.rideplatform.surge.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.StreamsConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.annotation.KafkaStreamsDefaultConfiguration;
import org.springframework.kafka.config.KafkaStreamsConfiguration;
import org.springframework.kafka.config.TopicBuilder;

import java.util.Map;

@Configuration
@EnableKafkaStreams
public class KafkaStreamsConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean(name = KafkaStreamsDefaultConfiguration.DEFAULT_STREAMS_CONFIG_BEAN_NAME)
    public KafkaStreamsConfiguration streamsConfig() {
        return new KafkaStreamsConfiguration(Map.of(
                StreamsConfig.APPLICATION_ID_CONFIG,            "surge-pricing-app",
                StreamsConfig.BOOTSTRAP_SERVERS_CONFIG,         bootstrapServers,
                StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG,   Serdes.String().getClass(),
                StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass(),
                // exactly-once semantics
                StreamsConfig.PROCESSING_GUARANTEE_CONFIG,      StreamsConfig.EXACTLY_ONCE_V2,
                // commit every 1s for low-latency surge updates
                StreamsConfig.COMMIT_INTERVAL_MS_CONFIG,        1000,
                StreamsConfig.NUM_STREAM_THREADS_CONFIG,        2,
                // local state store dir
                StreamsConfig.STATE_DIR_CONFIG,                 "/tmp/surge-streams-state"
        ));
    }

    // ensure output topic exists
    @Bean
    public NewTopic surgePricingTopic() {
        return TopicBuilder.name("surge.pricing.events")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic tripRequestsTopic() {
        return TopicBuilder.name("trip.requests")
                .partitions(6)
                .replicas(1)
                .build();
    }
}
