const ROLE_LEVEL = {
  VIEWER: 0,
  OPERATOR: 1,
  ADMIN: 2
};
function hasPermission(userRole, requiredRole) {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
export {
  ROLE_LEVEL,
  hasPermission
};
