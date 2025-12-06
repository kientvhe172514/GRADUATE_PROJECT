export class UpdateAccountResponseDto {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  sync_version: number;
  updated_at: Date;
}
