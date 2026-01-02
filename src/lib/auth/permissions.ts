import { User } from "./context";

export type UserRole = "admin" | "manager" | "member";

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage_users: boolean;
}

export const rolePermissions: Record<UserRole, Record<string, Permission>> = {
  admin: {
    amcs: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
    assets: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
    issues: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
    alerts: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
    users: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
    reports: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage_users: true,
    },
  },
  manager: {
    amcs: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      manage_users: false,
    },
    assets: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      manage_users: false,
    },
    issues: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      manage_users: false,
    },
    alerts: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      manage_users: false,
    },
    users: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
    reports: {
      view: true,
      create: true,
      edit: false,
      delete: false,
      manage_users: false,
    },
  },
  member: {
    amcs: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
    assets: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
    issues: {
      view: true,
      create: true,
      edit: false,
      delete: false,
      manage_users: false,
    },
    alerts: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
    reports: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      manage_users: false,
    },
  },
};

export function canAccess(
  user: User | null,
  resource: string,
  action: keyof Permission
): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role];
  const resourcePermissions = permissions[resource];
  return resourcePermissions?.[action] ?? false;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function isManager(user: User | null): boolean {
  return user?.role === "manager" || user?.role === "admin";
}

export function canManageUsers(user: User | null): boolean {
  return isAdmin(user);
}

export function requireAuth(user: User | null): boolean {
  return !!user;
}

export function requireAdmin(user: User | null): boolean {
  return isAdmin(user);
}

export function requireManager(user: User | null): boolean {
  return isManager(user);
}
