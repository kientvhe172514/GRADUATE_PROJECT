import { EmployeeShift } from '../../domain/entities/employee-shift.entity';

/**
 * Employee Shift Repository Port (Interface)
 *
 * Application layer defines interface
 * Infrastructure layer provides implementation
 */
export interface IEmployeeShiftRepository {
  /**
   * Find shift by employee ID and date
   */
  findByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShift | null>;

  /**
   * Find all shifts by status
   */
  findByStatus(status: string): Promise<EmployeeShift[]>;

  /**
   * Find shift by ID
   */
  findById(id: number): Promise<EmployeeShift | null>;

  /**
   * Find active shifts (currently in progress)
   */
  findActiveShifts(): Promise<EmployeeShift[]>;

  /**
   * Find shifts by date range (optionally filtered by employee)
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<EmployeeShift[]>;

  /**
   * Create new shift
   */
  create(shift: EmployeeShift): Promise<EmployeeShift>;

  /**
   * Update shift
   */
  update(
    id: number,
    data: Partial<EmployeeShift>,
  ): Promise<EmployeeShift>;
}
