export interface JwtPayload {
  // Standard JWT claims
  sub: number; // account_id
  iat: number;
  exp: number;
  
  // User identification
  email: string;
  employee_id?: number;
  employee_code?: string;
  
  // Role & Permissions
  role: string; // Primary role code
  permissions: string[]; // Array of permission codes
  
  // Context
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  full_name?: string;
  
  // Device tracking
  device_id?: string;
  session_id?: string;
  
  // Scope restrictions (for ABAC)
  scope?: {
    department_ids?: number[];
    location_ids?: number[];
    employee_ids?: number[];
  };
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
