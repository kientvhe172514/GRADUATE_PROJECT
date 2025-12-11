import { Test, TestingModule } from '@nestjs/testing';
import { ManualEditShiftUseCase } from '../../src/application/use-cases/employee-shift/manual-edit-shift.use-case';
import { ManualEditShiftDto } from '../../src/presentation/dtos/employee-shift-edit.dto';
import { EmployeeShiftRepository } from '../../src/infrastructure/repositories/employee-shift.repository';
import { AttendanceEditLogRepository } from '../../src/infrastructure/repositories/attendance-edit-log.repository';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ShiftStatus } from '../../src/domain/entities/employee-shift.entity';
import {
    createMockEmployeeShift,
    setupManualEditShiftMocks,
    expectSuccessResponse,
    expectShiftData,
    expectRepositoryCalls,
    expectEditLogsCreated,
    expectUpdateDataFormat,
    MockRepositories,
    MOCK_USER,
    MOCK_IP_ADDRESS,
    MOCK_EMPLOYEE_ID,
    PRECONDITIONS_BASIC_EDIT,
} from './mock-helpers';

describe('ManualEditShiftUseCase', () => {
    let useCase: ManualEditShiftUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockEmployeeShiftRepo = {
            findById: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findByEmployeeAndDateRange: jest.fn(),
        };

        const mockAttendanceEditLogRepo = {
            createLog: jest.fn(),
            findByShiftId: jest.fn(),
        };

        mocks = {
            mockEmployeeShiftRepo: mockEmployeeShiftRepo as any,
            mockAttendanceEditLogRepo: mockAttendanceEditLogRepo as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ManualEditShiftUseCase,
                {
                    provide: EmployeeShiftRepository,
                    useValue: mockEmployeeShiftRepo,
                },
                {
                    provide: AttendanceEditLogRepository,
                    useValue: mockAttendanceEditLogRepo,
                },
            ],
        }).compile();

        useCase = module.get<ManualEditShiftUseCase>(ManualEditShiftUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * @id MESTC01
         * @description Edit shift with check_in_time only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, check_in_time:"2025-01-01T08:30:00.000Z", is_manually_edited:true}}
         */
        it('MESTC01: Edit shift with check_in_time only', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                check_in_time: '2025-01-01T08:30:00.000Z',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift();
            const updatedShift = createMockEmployeeShift({
                check_in_time: new Date(dto.check_in_time!),
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['check_in_time']);
        });

        /**
         * @id MESTC02
         * @description Edit shift with check_out_time only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, check_out_time:"2025-01-01T17:30:00.000Z", is_manually_edited:true}}
         */
        it('MESTC02: Edit shift with check_out_time only', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                check_out_time: '2025-01-01T17:30:00.000Z',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift();
            const updatedShift = createMockEmployeeShift({
                check_out_time: new Date(dto.check_out_time!),
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['check_out_time']);
        });

        /**
         * @id MESTC03
         * @description Edit shift with status to PRESENT
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, status:"IN_PROGRESS", is_manually_edited:true}}
         */
        it('MESTC03: Edit shift with status to PRESENT', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                status: ShiftStatus.IN_PROGRESS,
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                status: ShiftStatus.ABSENT,
            });
            const updatedShift = createMockEmployeeShift({
                status: ShiftStatus.IN_PROGRESS,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                status: ShiftStatus.IN_PROGRESS,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['status']);
        });

        /**
         * @id MESTC04
         * @description Edit shift with status to ABSENT
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, status:"ABSENT", is_manually_edited:true}}
         */
        it('MESTC04: Edit shift with status to ABSENT', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                status: ShiftStatus.ABSENT,
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                status: ShiftStatus.IN_PROGRESS,
            });
            const updatedShift = createMockEmployeeShift({
                status: ShiftStatus.ABSENT,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                status: ShiftStatus.ABSENT,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
        });

        /**
         * @id MESTC05
         * @description Edit shift with notes only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, notes:"Adjusted due to forgot check-in", is_manually_edited:true}}
         */
        it('MESTC05: Edit shift with notes only', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                notes: 'Adjusted due to forgot check-in',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                notes: null,
            });
            const updatedShift = createMockEmployeeShift({
                notes: dto.notes,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                notes: dto.notes,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['notes']);
        });

        /**
         * @id MESTC06
         * @description Edit shift with multiple fields
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, check_in_time:"2025-01-01T08:30:00.000Z", check_out_time:"2025-01-01T17:30:00.000Z", status:"IN_PROGRESS", is_manually_edited:true}}
         */
        it('MESTC06: Edit shift with multiple fields', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                check_in_time: '2025-01-01T08:30:00.000Z',
                check_out_time: '2025-01-01T17:30:00.000Z',
                status: ShiftStatus.IN_PROGRESS,
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                check_in_time: new Date('2025-01-01T08:00:00.000Z'),
                check_out_time: new Date('2025-01-01T17:00:00.000Z'),
                status: ShiftStatus.ABSENT,
            });
            const updatedShift = createMockEmployeeShift({
                check_in_time: new Date(dto.check_in_time!),
                check_out_time: new Date(dto.check_out_time!),
                status: ShiftStatus.IN_PROGRESS,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                status: ShiftStatus.IN_PROGRESS,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 3); // 3 fields changed
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['check_in_time', 'check_out_time', 'status']);
        });

        /**
         * @id MESTC07
         * @description Edit shift notes when notes already exist
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, notes:"Updated notes", is_manually_edited:true}}
         */
        it('MESTC07: Edit shift notes when notes already exist', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                notes: 'Updated notes',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                notes: 'Old notes',
            });
            const updatedShift = createMockEmployeeShift({
                notes: dto.notes,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
                updated_at: new Date(),
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, true);
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                notes: dto.notes,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
        });

        /**
         * @id MESTC08
         * @description No changes applied when all values are same
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"No changes applied", data:{id:1, employee_id:100, is_manually_edited:false}}
         */
        it('MESTC08: No changes applied when all values are same', async () => {
            // Arrange
            const existingShift = createMockEmployeeShift({
                check_in_time: new Date('2025-01-01T08:00:00.000Z'),
            });

            const dto: ManualEditShiftDto = {
                check_in_time: '2025-01-01T08:00:00.000Z', // Same as existing
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            setupManualEditShiftMocks(mocks, existingShift, existingShift);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expectSuccessResponse(result, false); // No changes
            expectShiftData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                is_manually_edited: false, // Should remain false
            });
            expectRepositoryCalls(mocks, 1, false); // No update called
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 0); // No logs created
        });

        /**
         * @id MESTC09
         * @description Throw error when shift not found
         * @type A
         * @output "Shift not found."
         */
        it('MESTC09: Throw error when shift not found', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                notes: 'Updated notes',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            setupManualEditShiftMocks(mocks, null);

            // Act & Assert
            await expect(useCase.execute(999, dto, MOCK_USER, MOCK_IP_ADDRESS)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(999, dto, MOCK_USER, MOCK_IP_ADDRESS);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.NOT_FOUND);
                expect((error as BusinessException).message).toBe('Shift not found.');
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockEmployeeShiftRepo.findById).toHaveBeenCalledWith(999);
            expect(mocks.mockEmployeeShiftRepo.update).not.toHaveBeenCalled();
            expect(mocks.mockAttendanceEditLogRepo.createLog).not.toHaveBeenCalled();
        });

        /**
         * @id MESTC10
         * @description Convert date strings to Date objects in update data
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Shift edited successfully", data:{id:1, employee_id:100, check_in_time:Date, check_out_time:Date, is_manually_edited:true}}
         */
        it('MESTC10: Convert date strings to Date objects in update data', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                check_in_time: '2025-01-01T08:30:00.000Z',
                check_out_time: '2025-01-01T17:30:00.000Z',
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift();
            const updatedShift = createMockEmployeeShift({
                check_in_time: new Date(dto.check_in_time!),
                check_out_time: new Date(dto.check_out_time!),
                is_manually_edited: true,
            });

            setupManualEditShiftMocks(mocks, existingShift, updatedShift);

            // Act
            await useCase.execute(1, dto, MOCK_USER, MOCK_IP_ADDRESS);

            // Assert
            expect(mocks.mockEmployeeShiftRepo.update).toHaveBeenCalled();
            const updateCall = mocks.mockEmployeeShiftRepo.update.mock.calls[0];
            const updateData = updateCall[1];

            expect(updateData.check_in_time).toBeInstanceOf(Date);
            expect(updateData.check_out_time).toBeInstanceOf(Date);
        });
    });
});
