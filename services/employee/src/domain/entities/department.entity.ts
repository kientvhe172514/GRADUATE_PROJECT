export class Department {
  id: number;
  department_code: string;
  department_name: string;
  description?: string;
  parent_department_id?: number;
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
}