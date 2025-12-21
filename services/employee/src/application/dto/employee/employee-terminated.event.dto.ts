export class EmployeeTerminatedEventDto {
  employee_id: number;
  employeeId: number; // ✅ Alias for consistency
  termination_date: string;
  termination_reason: string;
}