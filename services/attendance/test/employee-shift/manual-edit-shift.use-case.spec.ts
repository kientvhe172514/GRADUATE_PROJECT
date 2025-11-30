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
         * MESTC01: Edit shift with check_in_time only
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with check_in_time
         * Output: Success response with updated check_in_time and edit log created
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
         * MESTC02: Edit shift with check_out_time only
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with check_out_time
         * Output: Success response with updated check_out_time and edit log created
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
         * MESTC03: Edit shift with status to PRESENT
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with status PRESENT
         * Output: Success response with updated status and edit log created
         */
        it('MESTC03: Edit shift with status to PRESENT', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                status: ShiftStatus.PRESENT,
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                status: ShiftStatus.ABSENT,
            });
            const updatedShift = createMockEmployeeShift({
                status: ShiftStatus.PRESENT,
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
                status: ShiftStatus.PRESENT,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 1);
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['status']);
        });

        /**
         * MESTC04: Edit shift with status to ABSENT
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with status ABSENT
         * Output: Success response with updated status and edit log created
         */
        it('MESTC04: Edit shift with status to ABSENT', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                status: ShiftStatus.ABSENT,
                edit_reason: 'Employee forgot to check-in, HR corrected based on evidence',
            };

            const existingShift = createMockEmployeeShift({
                status: ShiftStatus.PRESENT,
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
         * MESTC05: Edit shift with notes only
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with notes
         * Output: Success response with updated notes and edit log created
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
         * MESTC06: Edit shift with multiple fields
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with check_in_time, check_out_time, and status
         * Output: Success response with all fields updated and multiple edit logs created
         */
        it('MESTC06: Edit shift with multiple fields', async () => {
            // Arrange
            const dto: ManualEditShiftDto = {
                check_in_time: '2025-01-01T08:30:00.000Z',
                check_out_time: '2025-01-01T17:30:00.000Z',
                status: ShiftStatus.PRESENT,
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
                status: ShiftStatus.PRESENT,
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
                status: ShiftStatus.PRESENT,
                is_manually_edited: true,
                updated_by: MOCK_USER.sub,
            });
            expectRepositoryCalls(mocks, 1, true);
            expectEditLogsCreated(mocks.mockAttendanceEditLogRepo, 3); // 3 fields changed
            expectUpdateDataFormat(mocks.mockEmployeeShiftRepo, ['check_in_time', 'check_out_time', 'status']);
        });

        /**
         * MESTC07: Edit shift notes when notes already exist
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with new notes
         * Output: Success response with updated notes and edit log created
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
         * MESTC08: No changes applied when all values are same
         * Preconditions: ${PRECONDITIONS_BASIC_EDIT}
         * Input: ManualEditShiftDto with same values as existing shift
         * Output: Success response with "No changes applied" message, no updates, no edit logs
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
         * MESTC09: Throw error when shift not found
         * Preconditions: Database connected + Shift with ID 999 does NOT exist
         * Input: ManualEditShiftDto with non-existent shift ID
         * Output: BusinessException NOT_FOUND
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
         * Additional test: Verify date string conversion to Date objects
         */
        it('Should convert date strings to Date objects in update data', async () => {
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
