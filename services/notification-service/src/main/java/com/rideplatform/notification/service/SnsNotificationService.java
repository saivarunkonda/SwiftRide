package com.rideplatform.notification.service;

import com.rideplatform.notification.model.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Slf4j
@Service
public class SnsNotificationService {

    private final SnsClient snsClient;

    @Value("${aws.sns.topic-arn-rider}")
    private String riderTopicArn;

    @Value("${aws.sns.topic-arn-driver}")
    private String driverTopicArn;

    public SnsNotificationService(SnsClient snsClient) {
        this.snsClient = snsClient;
    }

    public void send(NotificationEvent event) {
        String topicArn = "DRIVER".equals(event.getRecipientType()) ? driverTopicArn : riderTopicArn;

        String message = buildMessage(event);

        try {
            snsClient.publish(PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject(event.getType())
                    .message(message)
                    // SNS message attributes let mobile push (FCM/APNS) filter by recipient
                    .messageAttributes(java.util.Map.of(
                            "recipientId", software.amazon.awssdk.services.sns.model.MessageAttributeValue.builder()
                                    .dataType("String")
                                    .stringValue(event.getRecipientId())
                                    .build()
                    ))
                    .build());

            log.info("SNS published type={} recipient={} trip={}", event.getType(), event.getRecipientId(), event.getTripId());
        } catch (Exception e) {
            log.error("SNS publish failed type={} error={}", event.getType(), e.getMessage());
            throw e;
        }
    }

    private String buildMessage(NotificationEvent event) {
        return switch (event.getType()) {
            case "TRIP_MATCHED"      -> String.format("Your driver is on the way! Trip ID: %s", event.getTripId());
            case "DRIVER_ARRIVING"   -> "Your driver is arriving now.";
            case "TRIP_STARTED"      -> "Your trip has started. Have a safe ride!";
            case "TRIP_COMPLETED"    -> String.format("Trip completed. %s", event.getMessage());
            default                  -> event.getMessage();
        };
    }
}
