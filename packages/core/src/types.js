// 역할 계층 — 높은 숫자일수록 상위 권한
export const ROLE_LEVEL = {
    VIEWER: 0,
    OPERATOR: 1,
    ADMIN: 2,
};
export function hasPermission(userRole, requiredRole) {
    return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
