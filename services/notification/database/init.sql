-- Create database
CREATE DATABASE notification_db;

-- Connect to database
\c notification_db;

-- Notifications table
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  
  -- Denormalized recipient info
  recipient_id BIGINT NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  
  -- Content
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  priority VARCHAR(20) DEFAULT 'NORMAL',
  
  -- Related entity
  related_entity_type VARCHAR(50),
  related_entity_id BIGINT,
  related_data JSONB,
  
  -- Delivery channels
  channels JSONB NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Delivery status
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP,
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP,
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Notification preferences table
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(employee_id, notification_type)
);

CREATE INDEX idx_preferences_employee ON notification_preferences(employee_id);

-- Notification templates table
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  title_template VARCHAR(500) NOT NULL,
  message_template TEXT NOT NULL,
  email_subject_template VARCHAR(500),
  email_body_template TEXT,
  
  default_channels JSONB NOT NULL,
  available_variables JSONB,
  
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push notification tokens table
CREATE TABLE push_notification_tokens (
  id SERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(employee_id, device_id)
);

CREATE INDEX idx_push_tokens_employee ON push_notification_tokens(employee_id);
CREATE INDEX idx_push_tokens_token ON push_notification_tokens(token);

-- Scheduled notifications table
CREATE TABLE scheduled_notifications (
  id SERIAL PRIMARY KEY,
  
  schedule_type VARCHAR(50) NOT NULL,
  
  recipient_type VARCHAR(20) NOT NULL,
  recipient_ids JSONB,
  
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  channels JSONB NOT NULL,
  
  scheduled_at TIMESTAMP,
  cron_expression VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  
  status VARCHAR(20) DEFAULT 'ACTIVE',
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_next_run ON scheduled_notifications(next_run_at);
CREATE INDEX idx_scheduled_status ON scheduled_notifications(status);

-- Insert sample templates
INSERT INTO notification_templates (
  template_code, 
  template_name, 
  notification_type, 
  title_template, 
  message_template,
  default_channels,
  available_variables,
  status
) VALUES 
(
  'ATTENDANCE_REMINDER',
  'Attendance Reminder',
  'ATTENDANCE_REMINDER',
  'Reminder: Check in for today',
  'Hello {{employee_name}}, please remember to check in for today at {{location}}.',
  '["PUSH", "IN_APP"]',
  '{"employee_name": "Employee name", "location": "Office location"}',
  'ACTIVE'
),
(
  'LEAVE_APPROVED',
  'Leave Request Approved',
  'LEAVE_REQUEST_APPROVED',
  'Leave Request Approved',
  'Your leave request from {{start_date}} to {{end_date}} has been approved.',
  '["EMAIL", "PUSH", "IN_APP"]',
  '{"start_date": "Leave start date", "end_date": "Leave end date"}',
  'ACTIVE'
),
(
  'FACE_VERIFICATION',
  'Face Verification Request',
  'FACE_VERIFICATION_REQUEST',
  'Face Verification Required',
  'Please complete your face verification for attendance at {{location}}.',
  '["PUSH", "IN_APP"]',
  '{"location": "Office location"}',
  'ACTIVE'
);
