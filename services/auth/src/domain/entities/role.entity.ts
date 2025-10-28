import { RoleStatus } from '../value-objects/role-status.vo';

export class Role {
  id?: number;
  code: string;
  name: string;
  description?: string;
  level: number; // Hierarchy level: 1=SUPER_ADMIN, 2=HR_ADMIN, 3=HR_STAFF, 4=MANAGER, 5=EMPLOYEE
  is_system_role: boolean = false; // System roles cannot be deleted
  status: RoleStatus = RoleStatus.ACTIVE;
  
  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
