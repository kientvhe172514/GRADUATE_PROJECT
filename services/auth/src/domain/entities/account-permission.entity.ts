export class AccountPermission {
  id?: number;
  account_id: number;
  permission_id: number;
  is_granted: boolean = true; // true = grant, false = revoke (ABAC override)
  scope_constraints?: Record<string, any>; // JSON: {department_ids: [1,2], location_ids: [3]}
  
  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
