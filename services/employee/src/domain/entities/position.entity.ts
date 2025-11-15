export class Position {
  id: number;
  position_code: string;
  position_name: string;
  description?: string;
  level: number;
  department_id?: number;
  department_name?: string; // Joined field from departments table
  suggested_role?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string = 'VND';
  status: string = 'ACTIVE';
  created_at?: Date;
  updated_at?: Date;
}