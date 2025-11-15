export interface JwtPayload {
  // Standard JWT claims
  sub: number; // account_id
  iat?: number;
  exp?: number;
  
  // ✅ ONLY 5 FIELDS: sub, email, employee_id, role, permissions
  email: string;
  employee_id?: number;
  role: string; // Primary role code
  permissions: string[]; // Array of permission codes
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
