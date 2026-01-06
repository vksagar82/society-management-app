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
  global_role VARCHAR(50) DEFAULT 'member', -- 'developer', 'admin', 'manager', 'member'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
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

-- User-Society mapping (many-to-many) - One user can be part of multiple societies
CREATE TABLE user_societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'manager', 'member' (role within this specific society)
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  flat_no VARCHAR(50),
  wing VARCHAR(50),
  is_primary BOOLEAN DEFAULT false, -- Mark primary society for user
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_society UNIQUE (user_id, society_id)
);

-- AMC (Annual Maintenance Contract) table
CREATE TABLE amcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(100), -- Unique identifier for vendor
  service_type VARCHAR(255) NOT NULL, -- 'Plumbing', 'Electrical', 'Pest Control', etc.
  work_order_number VARCHAR(255), -- Tracking work order from vendor
  invoice_number VARCHAR(255), -- Invoice tracking
  po_number VARCHAR(255), -- Purchase order number
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  annual_cost DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  payment_terms TEXT, -- Payment terms and conditions
  document_url TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  email VARCHAR(255),
  vendor_address TEXT,
  gst_number VARCHAR(50), -- GST/Tax ID
  
  -- Maintenance scheduling (for service due calculations)
  maintenance_frequency VARCHAR(50), -- 'monthly', 'quarterly', 'semi-annual', 'annual', 'custom'
  maintenance_interval_months INTEGER, -- Custom interval in months (e.g., 4 for every 4 months)
  last_service_date DATE,
  next_service_date DATE,
  service_reminder_days INTEGER DEFAULT 7, -- Days before service due to send reminder
  
  renewal_reminder_days INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'pending_renewal', 'cancelled'
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

-- Asset categories table
CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_asset_categories_society_name UNIQUE (society_id, name)
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
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

-- AMC to Assets mapping (many-to-many) - One AMC can have multiple assets
CREATE TABLE amc_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amc_id UUID NOT NULL REFERENCES amcs(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_amc_asset UNIQUE (amc_id, asset_id)
);

-- AMC Service History - Track each maintenance service performed
CREATE TABLE amc_service_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amc_id UUID NOT NULL REFERENCES amcs(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type VARCHAR(100), -- 'scheduled', 'emergency', 'breakdown'
  technician_name VARCHAR(255),
  work_performed TEXT,
  issues_found TEXT,
  parts_replaced JSONB, -- Array of parts replaced
  service_cost DECIMAL(12, 2),
  invoice_number VARCHAR(255),
  service_report_url TEXT, -- Link to service report/document
  assets_serviced JSONB, -- Array of asset IDs serviced in this visit
  next_service_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- Audit logs - Comprehensive change tracking (deletable only by developer role)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id),
  action VARCHAR(255) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  entity_type VARCHAR(100), -- 'user', 'asset', 'amc', 'issue', etc.
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  user_role VARCHAR(50), -- Role at time of action
  old_values JSONB, -- Previous state before change
  new_values JSONB, -- New state after change
  changed_fields JSONB, -- Array of field names that changed
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100), -- For tracing requests
  session_id VARCHAR(255), -- Session tracking
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB, -- Additional context (e.g., reason for change)
  is_deleted BOOLEAN DEFAULT false, -- Soft delete marker
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id), -- Only developers can delete
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Scopes - Define permissions for each role
CREATE TABLE role_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'developer', 'admin', 'manager', 'member'
  scope_name VARCHAR(100) NOT NULL, -- 'users.view', 'users.edit', 'assets.view', etc.
  scope_description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  CONSTRAINT uq_role_scope UNIQUE (society_id, role, scope_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_societies_user_id ON user_societies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_societies_society_id ON user_societies(society_id);
CREATE INDEX IF NOT EXISTS idx_user_societies_is_primary ON user_societies(is_primary);
CREATE INDEX IF NOT EXISTS idx_users_global_role ON users(global_role);
CREATE INDEX IF NOT EXISTS idx_amcs_society_id ON amcs(society_id);
CREATE INDEX IF NOT EXISTS idx_amcs_status ON amcs(status);
CREATE INDEX IF NOT EXISTS idx_amcs_vendor_name ON amcs(vendor_name);
CREATE INDEX IF NOT EXISTS idx_amcs_next_service_date ON amcs(next_service_date);
CREATE INDEX IF NOT EXISTS idx_amcs_work_order_number ON amcs(work_order_number);
CREATE INDEX IF NOT EXISTS idx_amc_service_history_amc_id ON amc_service_history(amc_id);
CREATE INDEX IF NOT EXISTS idx_amc_service_history_service_date ON amc_service_history(service_date);
CREATE INDEX IF NOT EXISTS idx_issues_society_id ON issues(society_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_assets_society_id ON assets(society_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_amc_assets_amc_id ON amc_assets(amc_id);
CREATE INDEX IF NOT EXISTS idx_amc_assets_asset_id ON amc_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_categories_society_id ON asset_categories(society_id);
CREATE INDEX IF NOT EXISTS idx_alerts_society_id ON alerts(society_id);
CREATE INDEX IF NOT EXISTS idx_alerts_delivery_status ON alerts(delivery_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_society_id ON audit_logs(society_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_deleted ON audit_logs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_role_scopes_society_id ON role_scopes(society_id);
CREATE INDEX IF NOT EXISTS idx_role_scopes_role ON role_scopes(role);
CREATE INDEX IF NOT EXISTS idx_role_scopes_scope_name ON role_scopes(scope_name);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_user_societies_approval_status ON user_societies(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_societies_society_approval ON user_societies(society_id, approval_status);

-- API Request Tracking Table
-- This table tracks all API requests for analytics and monitoring
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for API request tracking
CREATE INDEX IF NOT EXISTS idx_api_requests_society_id ON api_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_path ON api_requests(path);
CREATE INDEX IF NOT EXISTS idx_api_requests_society_created ON api_requests(society_id, created_at DESC);

-- Enable RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE amcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE amc_service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE amc_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

ALTER TABLE user_societies 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE user_societies 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status IS NULL OR approval_status = 'pending';