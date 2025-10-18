export class GetAccountDetailResponseDto {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department_id: number;
  department_name: string;
  position_id: number;
  position_name: string;
  employee_id: number;
  employee_code: string;
  last_login_at: Date | null;
  last_login_ip: string | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}
