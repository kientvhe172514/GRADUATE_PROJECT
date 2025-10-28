export class RoleEntity {
  id?: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_system_role: boolean;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
