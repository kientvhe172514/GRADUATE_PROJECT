export class RolePermission {
  id?: number;
  role_id: number;
  permission_id: number;
  
  // Audit
  created_at?: Date;
  created_by?: number;
}
