export type Role = "admin" | "member";

export const Permission = {
  ManageBilling: "billing:manage",
  ManageMembers: "members:manage",
  ViewDashboard: "dashboard:view",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const rolePermissions: Record<Role, ReadonlySet<PermissionKey>> = {
  admin: new Set([
    Permission.ManageBilling,
    Permission.ManageMembers,
    Permission.ViewDashboard,
  ]),
  member: new Set([Permission.ViewDashboard]),
};

export function can(role: Role, permission: PermissionKey): boolean {
  return rolePermissions[role].has(permission);
}
