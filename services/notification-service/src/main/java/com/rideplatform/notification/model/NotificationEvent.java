package com.rideplatform.notification.model;

import lombok.Data;

@Data
public class NotificationEvent {
    private String type;        // TRIP_MATCHED, DRIVER_ARRIVING, TRIP_STARTED, TRIP_COMPLETED
    private String recipientId;
    private String recipientType; // RIDER, DRIVER
    private String tripId;
    private String message;
    private String channel;     // PUSH, SMS, EMAIL
}
