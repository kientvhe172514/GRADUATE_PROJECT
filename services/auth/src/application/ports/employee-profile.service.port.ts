import { EmployeeProfileDto } from '../dto/employee/employee-profile.dto';

export interface EmployeeProfileServicePort {
  getEmployeeById(id: number): Promise<EmployeeProfileDto | null>;
  getManagedDepartmentIds(employeeId: number): Promise<number[]>;
}
