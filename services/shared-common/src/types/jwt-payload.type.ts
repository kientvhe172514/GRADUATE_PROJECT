export interface JwtPayload {
  // Standard JWT claims
  sub: number; // account_id
  iat?: number;
  exp?: number;
  
  // ✅ 6 FIELDS: sub, email, employee_id, role, permissions, managed_department_ids
  email: string;
  employee_id?: number;
  role: string; // Primary role code
  permissions: string[]; // Array of permission codes
  managed_department_ids?: number[]; // Department IDs managed by DEPARTMENT_MANAGER (role_id=3)
}

export interface RefreshTokenPayload {
  sub: number; // account_id
  token_family: string; // Rotate tokens family
  device_fingerprint?: string;
  iat: number;
  exp: number;
}

export interface ServiceTokenPayload {
  service_name: string;
  permissions: string[];
  iat: number;
  exp: number;
}
