import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AssignScheduleToEmployeesUseCase } from '../../src/application/use-cases/work-schedule/assign-schedule-to-employees.use-case';
import { AssignWorkScheduleDto } from '../../src/application/dtos/work-schedule.dto';
import {
    IWorkScheduleRepository,
    IEmployeeWorkScheduleRepository,
} from '../../src/application/ports/work-schedule.repository.port';
import {
    WORK_SCHEDULE_REPOSITORY,
    EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
} from '../../src/application/tokens';
import { BusinessException } from '@graduate-project/shared-common';
import { ScheduleType } from '../../src/domain/entities/work-schedule.entity';
import { ShiftGeneratorService } from '../../src/application/services/shift-generator.service';
import { EmployeeServiceClient } from '../../src/infrastructure/external-services/employee-service.client';
import {
    createMockWorkSchedule,
    createMockEmployeeWorkSchedule,
    setupAssignScheduleMocks,
    expectAssignScheduleSuccess,
    expectAssignmentsSaved,
    AssignScheduleMockRepositories,
    MOCK_USER,
} from './mock-helpers';

describe('AssignScheduleToEmployeesUseCase', () => {
    let useCase: AssignScheduleToEmployeesUseCase;
    let mocks: AssignScheduleMockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockWorkScheduleRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const mockEmployeeWorkScheduleRepository = {
            save: jest.fn(),
            saveMany: jest.fn(),
            findById: jest.fn(),
            findAssignmentsByEmployeeId: jest.fn(),
            findByScheduleId: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        };

        const mockShiftGeneratorService = {
            generateShiftsForEmployee: jest.fn(),
            generateShiftsForAllEmployees: jest.fn(),
            generateShiftsForNextDays: jest.fn(),
            generateShiftsForNextWeek: jest.fn(),
        };

        const mockEmployeeServiceClient = {
            getEmployeeById: jest.fn(),
            getEmployeesByIds: jest.fn(),
        };

        mocks = {
            mockWorkScheduleRepository: mockWorkScheduleRepository as any,
            mockEmployeeWorkScheduleRepository: mockEmployeeWorkScheduleRepository as any,
            mockShiftGeneratorService: mockShiftGeneratorService as any,
            mockEmployeeServiceClient: mockEmployeeServiceClient as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AssignScheduleToEmployeesUseCase,
                {
                    provide: WORK_SCHEDULE_REPOSITORY,
                    useValue: mockWorkScheduleRepository,
                },
                {
                    provide: EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
                    useValue: mockEmployeeWorkScheduleRepository,
                },
                {
                    provide: ShiftGeneratorService,
                    useValue: mockShiftGeneratorService,
                },
                {
                    provide: EmployeeServiceClient,
                    useValue: mockEmployeeServiceClient,
                },
            ],
        }).compile();

        useCase = module.get<AssignScheduleToEmployeesUseCase>(AssignScheduleToEmployeesUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * @id UASTC01
         * @description Successful assignment of schedule to single employee
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC01: Successful assignment of schedule to single employee', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
                effective_to: undefined,
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expect(mocks.mockWorkScheduleRepository.findById).toHaveBeenCalledWith(scheduleId);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC02
         * @description Successful assignment of schedule to multiple employees
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC02: Successful assignment of schedule to multiple employees', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100, 101, 102],
                effective_from: '2026-01-15',
                effective_to: undefined,
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC03
         * @description Successful assignment with effective_to date
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC03: Successful assignment with effective_to date', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
                effective_to: '2026-12-31',
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            const savedAssignments = mocks.mockEmployeeWorkScheduleRepository.saveMany.mock.calls[0][0];
            const assignmentJson = savedAssignments[0].toJSON();
            expect(assignmentJson.effective_to).toEqual(new Date('2026-12-31'));
        });

        /**
         * @id UASTC04
         * @description Failed assignment - Work schedule not found
         * @type A
         * @output "Work schedule not found."
         */
        it('UASTC04: Failed assignment - Work schedule not found', async () => {
            // Arrange
            const scheduleId = 999;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            setupAssignScheduleMocks(mocks, null, []);

            // Act & Assert
            await expect(useCase.execute(scheduleId, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(scheduleId, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).message).toBe('Work schedule not found.');
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockEmployeeWorkScheduleRepository.saveMany).not.toHaveBeenCalled();
        });

        /**
         * @id UASTC05
         * @description Failed assignment - effective_from in the past
         * @type A
         * @output "effective_from cannot be in the past. Please use today or a future date."
         */
        it('UASTC05: Failed assignment - effective_from in the past', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2020-01-01',
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act & Assert
            await expect(useCase.execute(scheduleId, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(scheduleId, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).message).toContain('cannot be in the past');
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockEmployeeWorkScheduleRepository.saveMany).not.toHaveBeenCalled();
        });

        /**
         * @id UASTC06
         * @description Failed assignment - Time conflict with existing schedule
         * @type A
         * @output "Employee already has a schedule that conflicts with the new schedule. Please adjust the time ranges or remove the existing schedule."
         */
        it('UASTC06: Failed assignment - Time conflict with existing schedule', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
                effective_to: '2026-12-31',
            };

            const newSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_name: 'Morning Shift',
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            const existingSchedule = createMockWorkSchedule({
                id: 2,
                schedule_name: 'Overlapping Shift',
                schedule_type: ScheduleType.FIXED,
                start_time: '09:00:00',
                end_time: '18:00:00',
            });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 2,
                effective_from: new Date('2026-01-15'),
                effective_to: new Date('2026-12-31'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);
            mocks.mockWorkScheduleRepository.findById
                .mockResolvedValueOnce(newSchedule)
                .mockResolvedValueOnce(existingSchedule);

            // Act & Assert
            await expect(useCase.execute(scheduleId, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(scheduleId, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).message).toContain('conflicts with the new schedule');
                expect((error as BusinessException).statusCode).toBe(409);
            }

            expect(mocks.mockEmployeeWorkScheduleRepository.saveMany).not.toHaveBeenCalled();
        });

        /**
         * @id UASTC07
         * @description Successful assignment - No time conflict (different time ranges)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC07: Successful assignment - No time conflict (different time ranges)', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
                effective_to: '2026-12-31',
            };

            const newSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_name: 'Morning Shift',
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '12:00:00',
            });

            const existingSchedule = createMockWorkSchedule({
                id: 2,
                schedule_name: 'Afternoon Shift',
                schedule_type: ScheduleType.FIXED,
                start_time: '13:00:00',
                end_time: '17:00:00',
            });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 2,
                effective_from: new Date('2026-01-15'),
                effective_to: new Date('2026-12-31'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);
            mocks.mockWorkScheduleRepository.findById
                .mockResolvedValueOnce(newSchedule)
                .mockResolvedValueOnce(existingSchedule);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC08
         * @description Successful assignment - effective_from is today
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC08: Successful assignment - effective_from is today', async () => {
            // Arrange
            const scheduleId = 1;
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: todayStr,
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC09
         * @description Successful assignment - No existing assignments for employee
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC09: Successful assignment - No existing assignments for employee', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            const workSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expect(mocks.mockEmployeeWorkScheduleRepository.findAssignmentsByEmployeeId).toHaveBeenCalledWith(100);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC10
         * @description Successful assignment - Existing assignment with no date overlap
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC10: Successful assignment - Existing assignment with no date overlap', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-06-01',
                effective_to: '2026-12-31',
            };

            const newSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00',
            });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 2,
                effective_from: new Date('2026-01-01'),
                effective_to: new Date('2026-05-31'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
            expectAssignmentsSaved(mocks.mockEmployeeWorkScheduleRepository, dto.employee_ids, scheduleId);
        });

        /**
         * @id UASTC11
         * @description Successful assignment - Existing assignment starts AFTER new assignment (No overlap)
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC11: Successful assignment - Existing assignment starts AFTER new assignment', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-01',
                effective_to: '2026-01-10',
            };

            const newSchedule = createMockWorkSchedule({ id: scheduleId });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 2,
                effective_from: new Date('2026-02-01'), // Starts later
                effective_to: new Date('2026-02-28'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
        });

        /**
         * @id UASTC12
         * @description Successful assignment - Orphaned existing schedule (skips validation)
         * @type A
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC12: Successful assignment - Orphaned existing schedule', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            const newSchedule = createMockWorkSchedule({ id: scheduleId });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 99, // Unknown ID
                effective_from: new Date('2026-01-15'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);
            // Mock findById returns null for ID 99
            mocks.mockWorkScheduleRepository.findById.mockImplementation(async (id) => {
                if (id === scheduleId) return newSchedule;
                return null;
            });

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
        });

        /**
         * @id UASTC13
         * @description Successful assignment - Flexible schedule (skips time overlap check)
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC13: Successful assignment - Flexible schedule', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            // Flexible schedule (no start/end time)
            const newSchedule = createMockWorkSchedule({
                id: scheduleId,
                schedule_type: ScheduleType.FLEXIBLE,
                start_time: null,
                end_time: null
            });

            const existingSchedule = createMockWorkSchedule({
                id: 2,
                schedule_type: ScheduleType.FIXED,
                start_time: '08:00:00',
                end_time: '17:00:00'
            });

            const existingAssignment = createMockEmployeeWorkSchedule({
                employee_id: 100,
                work_schedule_id: 2,
                effective_from: new Date('2026-01-15'),
            });

            setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment]);
            mocks.mockWorkScheduleRepository.findById
                .mockResolvedValueOnce(newSchedule)
                .mockResolvedValueOnce(existingSchedule);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);
        });

        /**
         * @id UASTC14
         * @description Successful assignment - Async shift generation with short duration
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC14: Successful assignment - Async shift generation with short duration', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-01',
                effective_to: '2026-01-03', // 3 days
            };

            const workSchedule = createMockWorkSchedule({ id: scheduleId });
            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mocks.mockShiftGeneratorService.generateShiftsForEmployee).toHaveBeenCalled();
            // Verify end date passed to generator is effective_to (2026-01-03) not +7 days
            const callArgs = mocks.mockShiftGeneratorService.generateShiftsForEmployee.mock.calls[0];
            const endDateArg = callArgs[2] as Date;
            // endDate set to 23:59:59.999 of 2026-01-03
            expect(endDateArg.toISOString().split('T')[0]).toBe('2026-01-03');
        });

        /**
        * @id UASTC15
        * @description Successful assignment - Handle async shift generation error
        * @type A
        * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
        */
        it('UASTC15: Successful assignment - Handle async shift generation error', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            const workSchedule = createMockWorkSchedule({ id: scheduleId });
            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Mock error
            mocks.mockShiftGeneratorService.generateShiftsForEmployee.mockRejectedValue(new Error('Async Error'));

            // Spy on logger
            const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(loggerErrorSpy).toHaveBeenCalled();
            expect(loggerErrorSpy.mock.calls.some(args => args[0].includes('Failed to generate shifts'))).toBeTruthy();

            loggerErrorSpy.mockRestore();
        });

        /**
         * @id UASTC16
         * @description Successful assignment - Async shift generation returns partial errors
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC16: Successful assignment - Async shift generation returns partial errors', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            const workSchedule = createMockWorkSchedule({ id: scheduleId });
            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Mock partial error result
            mocks.mockShiftGeneratorService.generateShiftsForEmployee.mockResolvedValue({
                totalProcessed: 7,
                shiftsCreated: 5,
                shiftsSkipped: 0,
                errors: [{ employeeId: 100, error: 'Simulated partial error' }]
            });

            // Spy on logger
            const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(loggerErrorSpy).toHaveBeenCalled();
            // Check specifically for the partial error log
            expect(loggerErrorSpy.mock.calls.some(args => args[0].includes('Errors for employee 100'))).toBeTruthy();

            loggerErrorSpy.mockRestore();
        });

        /**
         * @id UASTC17
         * @description Successful assignment - Critical failure in async shift generation
         * @type A
         * @output {status:"SUCCESS", statusCode:200, message:"Work schedule assigned to employees successfully. Shifts are being generated."}
         */
        it('UASTC17: Successful assignment - Critical failure in async shift generation', async () => {
            // Arrange
            const scheduleId = 1;
            const dto: AssignWorkScheduleDto = {
                employee_ids: [100],
                effective_from: '2026-01-15',
            };

            const workSchedule = createMockWorkSchedule({ id: scheduleId });
            setupAssignScheduleMocks(mocks, workSchedule, []);

            // Spy and mock private method rejection
            const generateSpy = jest.spyOn(useCase as any, 'generateInitialShifts').mockRejectedValue(new Error('Critical Error'));

            // Spy on logger
            const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

            // Act
            const result = await useCase.execute(scheduleId, dto, MOCK_USER);

            // Assert
            expectAssignScheduleSuccess(result);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(loggerErrorSpy).toHaveBeenCalled();
            // Check for the top-level catch block log
            expect(loggerErrorSpy.mock.calls.some(args => args[0].includes('Failed to generate initial shifts after assignment'))).toBeTruthy();

            loggerErrorSpy.mockRestore();
            generateSpy.mockRestore();
        });
    });
});
