import { RoleStatus } from '../value-objects/role-status.vo';

export class Role {
  id?: number;
  code: string;
  name: string;
  description?: string;
  level: number; // Hierarchy level: 1=ADMIN (highest), 2=HR_MANAGER, 3=DEPARTMENT_MANAGER, 4=EMPLOYEE (lowest)
  is_system_role: boolean = false; // System roles cannot be deleted
  status: RoleStatus = RoleStatus.ACTIVE;
  
  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
