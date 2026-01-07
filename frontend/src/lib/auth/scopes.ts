// API Scopes and permissions management

export type RoleType = "developer" | "admin" | "manager" | "member";

export interface Scope {
  name: string;
  description: string;
  category:
    | "users"
    | "assets"
    | "amcs"
    | "issues"
    | "admin"
    | "audit"
    | "settings";
  actions: string[];
}

// Default scopes available in the system
export const AVAILABLE_SCOPES: Record<string, Scope> = {
  // User Management Scopes
  "users.view": {
    name: "users.view",
    description: "View user profiles and information",
    category: "users",
    actions: ["view", "list"],
  },
  "users.edit": {
    name: "users.edit",
    description: "Edit user profiles and information",
    category: "users",
    actions: ["edit", "update"],
  },
  "users.manage": {
    name: "users.manage",
    description: "Create, delete, and manage users",
    category: "users",
    actions: ["create", "delete", "manage"],
  },

  // Asset Management Scopes
  "assets.view": {
    name: "assets.view",
    description: "View assets and asset categories",
    category: "assets",
    actions: ["view", "list"],
  },
  "assets.edit": {
    name: "assets.edit",
    description: "Edit asset information",
    category: "assets",
    actions: ["edit", "update"],
  },
  "assets.manage": {
    name: "assets.manage",
    description: "Create, delete, and manage assets",
    category: "assets",
    actions: ["create", "delete", "manage"],
  },

  // AMC Management Scopes
  "amcs.view": {
    name: "amcs.view",
    description: "View AMC contracts and service history",
    category: "amcs",
    actions: ["view", "list"],
  },
  "amcs.edit": {
    name: "amcs.edit",
    description: "Edit AMC contract details",
    category: "amcs",
    actions: ["edit", "update"],
  },
  "amcs.manage": {
    name: "amcs.manage",
    description: "Create, delete, and manage AMC contracts",
    category: "amcs",
    actions: ["create", "delete", "manage"],
  },

  // Issue Management Scopes
  "issues.view": {
    name: "issues.view",
    description: "View issues and complaints",
    category: "issues",
    actions: ["view", "list"],
  },
  "issues.edit": {
    name: "issues.edit",
    description: "Edit and comment on issues",
    category: "issues",
    actions: ["edit", "update", "comment"],
  },
  "issues.manage": {
    name: "issues.manage",
    description: "Create, delete, and manage issues",
    category: "issues",
    actions: ["create", "delete", "manage"],
  },

  // Admin Scopes
  "admin.view": {
    name: "admin.view",
    description: "Access admin dashboard and analytics",
    category: "admin",
    actions: ["view", "dashboard"],
  },
  "admin.settings": {
    name: "admin.settings",
    description: "Manage system settings and configurations",
    category: "settings",
    actions: ["edit", "manage"],
  },

  // Audit Scopes
  "audit.view": {
    name: "audit.view",
    description: "View audit logs",
    category: "audit",
    actions: ["view", "list"],
  },
  "audit.manage": {
    name: "audit.manage",
    description: "Delete audit logs (developer only)",
    category: "audit",
    actions: ["delete", "manage"],
  },
};

// Default role scopes mappings
export const DEFAULT_ROLE_SCOPES: Record<RoleType, string[]> = {
  developer: [
    "users.view",
    "users.edit",
    "users.manage",
    "assets.view",
    "assets.edit",
    "assets.manage",
    "amcs.view",
    "amcs.edit",
    "amcs.manage",
    "issues.view",
    "issues.edit",
    "issues.manage",
    "admin.view",
    "admin.settings",
    "audit.view",
    "audit.manage",
  ],
  admin: [
    "users.view",
    "users.edit",
    "users.manage",
    "assets.view",
    "assets.edit",
    "assets.manage",
    "amcs.view",
    "amcs.edit",
    "amcs.manage",
    "issues.view",
    "issues.edit",
    "issues.manage",
    "admin.view",
    "admin.settings",
    "audit.view",
  ],
  manager: [
    "users.view",
    "assets.view",
    "assets.edit",
    "amcs.view",
    "amcs.edit",
    "issues.view",
    "issues.edit",
    "issues.manage",
  ],
  member: [
    "users.view",
    "assets.view",
    "amcs.view",
    "issues.view",
    "issues.edit",
  ],
};

// Get scopes for a role
export function getScopesByRole(role: RoleType): string[] {
  return DEFAULT_ROLE_SCOPES[role] || [];
}

// Check if a role has a specific scope
export function hasScope(role: RoleType, scope: string): boolean {
  return DEFAULT_ROLE_SCOPES[role]?.includes(scope) || false;
}

// Get all scopes grouped by category
export function getScopesGroupedByCategory(): Record<string, Scope[]> {
  const grouped: Record<string, Scope[]> = {};

  Object.values(AVAILABLE_SCOPES).forEach((scope) => {
    if (!grouped[scope.category]) {
      grouped[scope.category] = [];
    }
    grouped[scope.category].push(scope);
  });

  return grouped;
}

// Get scope object by name
export function getScopeByName(name: string): Scope | undefined {
  return AVAILABLE_SCOPES[name];
}
