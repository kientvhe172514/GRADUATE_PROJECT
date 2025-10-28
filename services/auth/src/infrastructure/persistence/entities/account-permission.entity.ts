export class AccountPermissionEntity {
  id?: number;
  account_id: number;
  permission_id: number;
  is_granted: boolean;
  scope_constraints?: object;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
