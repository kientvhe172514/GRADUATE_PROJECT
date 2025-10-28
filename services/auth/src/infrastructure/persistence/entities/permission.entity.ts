export class PermissionEntity {
  id?: number;
  code: string;
  resource: string;
  action: string;
  scope?: string;
  description?: string;
  is_system_permission: boolean;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
