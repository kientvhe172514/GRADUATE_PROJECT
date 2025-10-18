export class ListAccountsRequestDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  status?: string;
  role?: string;
  department_id?: number;
  sort_by?: string = 'created_at';
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListAccountsResponseDto {
  accounts: AccountSummaryDto[];
  pagination: PaginationDto;
}

export class AccountSummaryDto {
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
  created_at: Date;
  updated_at: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
