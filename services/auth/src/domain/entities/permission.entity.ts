import { PermissionStatus } from '../value-objects/permission-status.vo';

export class Permission {
  id?: number;
  code: string; // Format: resource.action (e.g., 'employee.create', 'attendance.read.own')
  resource: string; // e.g., 'employee', 'attendance', 'leave'
  action: string; // e.g., 'create', 'read', 'update', 'delete', 'approve'
  scope?: string; // e.g., 'own', 'department', 'all'
  description?: string;
  is_system_permission: boolean = false; // System permissions cannot be deleted
  status: PermissionStatus = PermissionStatus.ACTIVE;
  
  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}
