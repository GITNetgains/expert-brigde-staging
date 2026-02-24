-- Session Logs — the factual record of every Zoom session
CREATE TABLE IF NOT EXISTS session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id VARCHAR(24) NOT NULL,
    booking_code VARCHAR(10),
    zoom_meeting_id VARCHAR(20) NOT NULL,
    zoom_meeting_uuid VARCHAR(100),
    meeting_topic VARCHAR(255),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    scheduled_duration_minutes INT NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    actual_duration_minutes INT,
    expert_id VARCHAR(24) NOT NULL,
    client_id VARCHAR(24) NOT NULL,
    expert_joined_at TIMESTAMPTZ,
    expert_left_at TIMESTAMPTZ,
    client_joined_at TIMESTAMPTZ,
    client_left_at TIMESTAMPTZ,
    session_status VARCHAR(20) DEFAULT 'scheduled',
    zoom_data_harvested BOOLEAN DEFAULT FALSE,
    zoom_link_deactivated BOOLEAN DEFAULT FALSE,
    harvested_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    raw_zoom_response JSONB,
    raw_participants_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_logs_appointment ON session_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_zoom_meeting ON session_logs(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_status ON session_logs(session_status);
CREATE INDEX IF NOT EXISTS idx_session_logs_harvest ON session_logs(zoom_data_harvested, zoom_link_deactivated);
CREATE INDEX IF NOT EXISTS idx_session_logs_expert ON session_logs(expert_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_client ON session_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_scheduled ON session_logs(scheduled_start);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_logs_appointment_unique ON session_logs(appointment_id);

-- Session Participants — detailed join/leave log from Zoom
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
    zoom_participant_id VARCHAR(50),
    participant_role VARCHAR(20) NOT NULL,
    display_name VARCHAR(100),
    join_time TIMESTAMPTZ NOT NULL,
    leave_time TIMESTAMPTZ,
    duration_seconds INT,
    ip_address VARCHAR(45),
    device_type VARCHAR(50),
    connection_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_participants_log ON session_participants(session_log_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_role ON session_participants(participant_role);

-- Session Billing — the financial record (one row per session)
CREATE TABLE IF NOT EXISTS session_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
    appointment_id VARCHAR(24) NOT NULL,
    booked_duration_minutes INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    booked_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    razorpay_payment_id VARCHAR(50),
    razorpay_order_id VARCHAR(50),
    payment_method VARCHAR(30),
    actual_duration_minutes INT,
    delivered_amount DECIMAL(10,2),
    unused_minutes INT DEFAULT 0,
    credit_amount DECIMAL(10,2) DEFAULT 0,
    credit_status VARCHAR(20) DEFAULT 'none',
    credit_id UUID,
    credit_issued_at TIMESTAMPTZ,
    credit_expires_at TIMESTAMPTZ,
    credit_applied_to VARCHAR(24),
    expert_payout_amount DECIMAL(10,2),
    platform_commission DECIMAL(10,2),
    commission_rate DECIMAL(5,4),
    expert_payout_status VARCHAR(20) DEFAULT 'pending',
    expert_payout_reference VARCHAR(100),
    expert_payout_date TIMESTAMPTZ,
    gst_applicable BOOLEAN DEFAULT TRUE,
    gst_rate DECIMAL(5,4) DEFAULT 0.18,
    gst_amount DECIMAL(10,2),
    gst_type VARCHAR(10),
    cgst_amount DECIMAL(10,2),
    sgst_amount DECIMAL(10,2),
    igst_amount DECIMAL(10,2),
    sac_code VARCHAR(10) DEFAULT '998399',
    hsn_sac_description VARCHAR(100) DEFAULT 'Management consulting services',
    place_of_supply_state VARCHAR(50),
    supplier_state VARCHAR(50) DEFAULT 'Chandigarh',
    is_interstate BOOLEAN,
    transaction_type VARCHAR(5) DEFAULT 'B2C',
    client_gstin VARCHAR(15),
    client_legal_name VARCHAR(200),
    client_state_code VARCHAR(2),
    supplier_gstin VARCHAR(15),
    supplier_legal_name VARCHAR(200) DEFAULT 'Elevatexcel Consulting Private Limited',
    invoice_id VARCHAR(50),
    invoice_date DATE,
    invoice_url VARCHAR(500),
    billing_status VARCHAR(20) DEFAULT 'pending',
    no_show_party VARCHAR(20),
    no_show_policy_applied VARCHAR(50),
    no_show_refund_amount DECIMAL(10,2),
    no_show_penalty_amount DECIMAL(10,2),
    calculated_at TIMESTAMPTZ,
    last_recalculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_billing_session ON session_billing(session_log_id);
CREATE INDEX IF NOT EXISTS idx_session_billing_appointment ON session_billing(appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_billing_status ON session_billing(billing_status);
CREATE INDEX IF NOT EXISTS idx_session_billing_payout ON session_billing(expert_payout_status);
CREATE INDEX IF NOT EXISTS idx_session_billing_credit ON session_billing(credit_status);
CREATE INDEX IF NOT EXISTS idx_session_billing_gst ON session_billing(gst_type, place_of_supply_state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_billing_appointment_unique ON session_billing(appointment_id);
