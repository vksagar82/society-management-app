-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (society members)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'manager', 'member'
  flat_no VARCHAR(50),
  wing VARCHAR(50),
  society_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Society table
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AMC (Annual Maintenance Contract) table
CREATE TABLE amcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(255) NOT NULL, -- 'Plumbing', 'Electrical', 'Pest Control', etc.
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  annual_cost DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  document_url TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  email VARCHAR(255),
  renewal_reminder_days INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'pending_renewal'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Issues/Complaints table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100), -- 'Maintenance', 'Safety', 'Amenities', 'Common Area', etc.
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  reported_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  location VARCHAR(255),
  images JSONB, -- Array of image URLs
  attachment_urls JSONB,
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  target_resolution_date DATE,
  resolved_date TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issue comments/updates
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Elevator', 'CCTV', 'Generator', 'Water Pump', etc.
  description TEXT,
  purchase_date DATE,
  purchase_cost DECIMAL(12, 2),
  warranty_expiry_date DATE,
  amc_id UUID REFERENCES amcs(id),
  location VARCHAR(255),
  asset_code VARCHAR(100) UNIQUE,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'decommissioned'
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_frequency VARCHAR(50), -- 'monthly', 'quarterly', 'annually'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Asset maintenance history
CREATE TABLE asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type VARCHAR(100), -- 'preventive', 'corrective', 'emergency'
  cost DECIMAL(12, 2),
  performed_by VARCHAR(255),
  description TEXT,
  notes TEXT,
  images JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Alerts/Notifications table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  alert_type VARCHAR(50), -- 'amc_expiry', 'issue_update', 'asset_maintenance', 'general'
  severity VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'critical'
  related_entity_type VARCHAR(50), -- 'amc', 'issue', 'asset'
  related_entity_id UUID,
  recipients JSONB, -- Array of user IDs or phone numbers
  channels JSONB, -- ['whatsapp', 'telegram', 'email']
  sent_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  delivery_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT true,
  telegram_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  telegram_chat_id VARCHAR(255),
  whatsapp_number VARCHAR(20),
  notify_on_amc_expiry BOOLEAN DEFAULT true,
  notify_on_issue_update BOOLEAN DEFAULT true,
  notify_on_asset_maintenance BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard statistics (for performance)
CREATE TABLE dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  total_issues INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  total_assets INTEGER DEFAULT 0,
  active_amcs INTEGER DEFAULT 0,
  expiring_amcs INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_society_id ON users(society_id);
CREATE INDEX idx_amcs_society_id ON amcs(society_id);
CREATE INDEX idx_amcs_status ON amcs(status);
CREATE INDEX idx_issues_society_id ON issues(society_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_assets_society_id ON assets(society_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_alerts_society_id ON alerts(society_id);
CREATE INDEX idx_alerts_delivery_status ON alerts(delivery_status);
CREATE INDEX idx_audit_logs_society_id ON audit_logs(society_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add user foreign key to societies
ALTER TABLE users ADD CONSTRAINT fk_users_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE SET NULL;

-- Enable RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE amcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
