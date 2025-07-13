// Permissions utility functions

export const hasPermission = (userPermissions: string[] | undefined, requiredPermission: string): boolean => {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[] | undefined, requiredPermissions: string[]): boolean => {
  if (!userPermissions) return false;
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[] | undefined, requiredPermissions: string[]): boolean => {
  if (!userPermissions) return false;
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}; 