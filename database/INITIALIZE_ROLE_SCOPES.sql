-- Initialize role_scopes table with default scopes
-- This populates the role_scopes table with the default scopes for each role

INSERT INTO role_scopes (role, scope_name, scope_description, is_enabled) VALUES
-- Developer scopes
('developer', 'users.view', 'View user profiles and information', true),
('developer', 'users.edit', 'Edit user profiles and information', true),
('developer', 'users.manage', 'Create, delete, and manage users', true),
('developer', 'assets.view', 'View assets and asset categories', true),
('developer', 'assets.edit', 'Edit asset information', true),
('developer', 'assets.manage', 'Create, delete, and manage assets', true),
('developer', 'amcs.view', 'View AMC contracts and service history', true),
('developer', 'amcs.edit', 'Edit AMC contract details', true),
('developer', 'amcs.manage', 'Create, delete, and manage AMC contracts', true),
('developer', 'issues.view', 'View issues and complaints', true),
('developer', 'issues.edit', 'Edit and comment on issues', true),
('developer', 'issues.manage', 'Create, delete, and manage issues', true),
('developer', 'admin.view', 'Access admin dashboard and analytics', true),
('developer', 'admin.settings', 'Manage system settings and configurations', true),
('developer', 'audit.view', 'View audit logs', true),
('developer', 'audit.manage', 'Delete audit logs (developer only)', true),

-- Admin scopes
('admin', 'users.view', 'View user profiles and information', true),
('admin', 'users.edit', 'Edit user profiles and information', true),
('admin', 'users.manage', 'Create, delete, and manage users', true),
('admin', 'assets.view', 'View assets and asset categories', true),
('admin', 'assets.edit', 'Edit asset information', true),
('admin', 'assets.manage', 'Create, delete, and manage assets', true),
('admin', 'amcs.view', 'View AMC contracts and service history', true),
('admin', 'amcs.edit', 'Edit AMC contract details', true),
('admin', 'amcs.manage', 'Create, delete, and manage AMC contracts', true),
('admin', 'issues.view', 'View issues and complaints', true),
('admin', 'issues.edit', 'Edit and comment on issues', true),
('admin', 'issues.manage', 'Create, delete, and manage issues', true),
('admin', 'admin.view', 'Access admin dashboard and analytics', true),
('admin', 'admin.settings', 'Manage system settings and configurations', true),
('admin', 'audit.view', 'View audit logs', true),

-- Manager scopes
('manager', 'users.view', 'View user profiles and information', true),
('manager', 'assets.view', 'View assets and asset categories', true),
('manager', 'assets.edit', 'Edit asset information', true),
('manager', 'amcs.view', 'View AMC contracts and service history', true),
('manager', 'amcs.edit', 'Edit AMC contract details', true),
('manager', 'issues.view', 'View issues and complaints', true),
('manager', 'issues.edit', 'Edit and comment on issues', true),
('manager', 'issues.manage', 'Create, delete, and manage issues', true),
('manager', 'admin.view', 'Access admin dashboard and analytics', true),

-- Member scopes
('member', 'users.view', 'View user profiles and information', true),
('member', 'assets.view', 'View assets and asset categories', true),
('member', 'issues.view', 'View issues and complaints', true),
('member', 'issues.edit', 'Edit and comment on issues', true),
('member', 'issues.manage', 'Create, delete, and manage issues', true)
ON CONFLICT (society_id, role, scope_name) DO NOTHING;
