# SNS topics for push notifications
resource "aws_sns_topic" "rider_notifications" {
  name = "rider-notifications"
}

resource "aws_sns_topic" "driver_notifications" {
  name = "driver-notifications"
}

# SQS dead-letter queues for failed notifications
resource "aws_sqs_queue" "rider_dlq" {
  name                      = "rider-notifications-dlq"
  message_retention_seconds = 1209600  # 14 days
}

resource "aws_sqs_queue" "driver_dlq" {
  name                      = "driver-notifications-dlq"
  message_retention_seconds = 1209600
}

output "rider_topic_arn" {
  value = aws_sns_topic.rider_notifications.arn
}

output "driver_topic_arn" {
  value = aws_sns_topic.driver_notifications.arn
}
