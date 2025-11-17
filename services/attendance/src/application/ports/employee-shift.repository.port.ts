import { EmployeeShiftEntity } from '../../domain/entities/employee-shift.entity';

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
  ): Promise<EmployeeShiftEntity | null>;

  /**
   * Find all shifts by status
   */
  findByStatus(status: string): Promise<EmployeeShiftEntity[]>;

  /**
   * Find shift by ID
   */
  findById(id: number): Promise<EmployeeShiftEntity | null>;

  /**
   * Find active shifts (currently in progress)
   */
  findActiveShifts(): Promise<EmployeeShiftEntity[]>;

  /**
   * Create new shift
   */
  create(shift: EmployeeShiftEntity): Promise<EmployeeShiftEntity>;

  /**
   * Update shift
   */
  update(
    id: number,
    data: Partial<EmployeeShiftEntity>,
  ): Promise<EmployeeShiftEntity>;
}
