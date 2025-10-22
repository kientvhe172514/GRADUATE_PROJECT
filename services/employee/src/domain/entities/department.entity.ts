export class Department {
  id: number;
  department_code: string;
  department_name: string;
  description?: string;
  parent_department_id?: number;
  parent?: Department;
  level: number = 1;
  path?: string;
  manager_id?: number;
  office_address?: string;
  office_latitude?: number;
  office_longitude?: number;
  office_radius_meters: number = 100;
  status: string = 'ACTIVE';
  created_at?: Date;
  updated_at?: Date;

  constructor(partial: Partial<Department>) {
    Object.assign(this, partial);
    this.level = this.level || 1;
    this.office_radius_meters = this.office_radius_meters || 100;
    this.status = this.status || 'ACTIVE';
  }
}