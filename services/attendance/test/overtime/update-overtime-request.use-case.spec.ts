import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOvertimeRequestUseCase } from '../../src/application/use-cases/overtime/update-overtime-request.use-case';
import { UpdateOvertimeRequestDto, OvertimeStatus } from '../../src/application/dtos/overtime-request.dto';
import { OvertimeRequestRepository } from '../../src/infrastructure/repositories/overtime-request.repository';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import {
    createMockOvertimeRequest,
    setupUpdateOvertimeMocks,
    expectSuccessResponse,
    expectOvertimeData,
    expectRepositoryCalls,
    expectUpdateDataFormat,
    MockRepositories,
    MOCK_USER,
    MOCK_OTHER_USER,
    MOCK_EMPLOYEE_ID,
    PRECONDITIONS_BASIC_UPDATE,
} from './mock-helpers';

describe('UpdateOvertimeRequestUseCase', () => {
    let useCase: UpdateOvertimeRequestUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockOvertimeRepo = {
            findOne: jest.fn(),
            updateRequest: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            approveRequest: jest.fn(),
            rejectRequest: jest.fn(),
        };

        mocks = {
            mockOvertimeRepo: mockOvertimeRepo as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateOvertimeRequestUseCase,
                {
                    provide: OvertimeRequestRepository,
                    useValue: mockOvertimeRepo,
                },
            ],
        }).compile();

        useCase = module.get<UpdateOvertimeRequestUseCase>(UpdateOvertimeRequestUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * @id UORTC01
         * @description Update overtime request with start_time only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, start_time:"2025-01-15T18:30:00Z", status:"PENDING"}}
         */
        it('UORTC01: Update overtime request with start_time only', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                start_time: '2025-01-15T18:30:00Z',
            };

            const existingRequest = createMockOvertimeRequest();
            const updatedRequest = {
                ...existingRequest,
                start_time: new Date(dto.start_time!),
                updated_at: new Date(),
            };

            setupUpdateOvertimeMocks(mocks, existingRequest, updatedRequest);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectOvertimeData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                start_time: new Date(dto.start_time!),
            });
            expectRepositoryCalls(mocks.mockOvertimeRepo, 1);
            expectUpdateDataFormat(mocks.mockOvertimeRepo, ['start_time']);
        });

        /**
         * @id UORTC02
         * @description Update overtime request with end_time only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, end_time:"2025-01-15T21:30:00Z", status:"PENDING"}}
         */
        it('UORTC02: Update overtime request with end_time only', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                end_time: '2025-01-15T21:30:00Z',
            };

            const existingRequest = createMockOvertimeRequest();
            const updatedRequest = {
                ...existingRequest,
                end_time: new Date(dto.end_time!),
                updated_at: new Date(),
            };

            setupUpdateOvertimeMocks(mocks, existingRequest, updatedRequest);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectOvertimeData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                end_time: new Date(dto.end_time!),
            });
            expectRepositoryCalls(mocks.mockOvertimeRepo, 1);
            expectUpdateDataFormat(mocks.mockOvertimeRepo, ['end_time']);
        });

        /**
         * @id UORTC03
         * @description Update overtime request with estimated_hours only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, estimated_hours:3.5, status:"PENDING"}}
         */
        it('UORTC03: Update overtime request with estimated_hours only', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                estimated_hours: 3.5,
            };

            const existingRequest = createMockOvertimeRequest();
            const updatedRequest = {
                ...existingRequest,
                estimated_hours: dto.estimated_hours,
                updated_at: new Date(),
            };

            setupUpdateOvertimeMocks(mocks, existingRequest, updatedRequest);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectOvertimeData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                estimated_hours: 3.5,
            });
            expectRepositoryCalls(mocks.mockOvertimeRepo, 1);
            expect(result.data.estimated_hours).toBe(3.5);
        });

        /**
         * @id UORTC04
         * @description Update overtime request with reason only
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, reason:"Extended due to additional tasks", status:"PENDING"}}
         */
        it('UORTC04: Update overtime request with reason only', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                reason: 'Extended due to additional tasks',
            };

            const existingRequest = createMockOvertimeRequest();
            const updatedRequest = {
                ...existingRequest,
                reason: dto.reason,
                updated_at: new Date(),
            };

            setupUpdateOvertimeMocks(mocks, existingRequest, updatedRequest);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectOvertimeData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                reason: dto.reason,
            });
            expectRepositoryCalls(mocks.mockOvertimeRepo, 1);
            expect(result.data.reason).toBe('Extended due to additional tasks');
        });

        /**
         * @id UORTC05
         * @description Update overtime request with multiple fields
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, start_time:"2025-01-15T18:30:00Z", end_time:"2025-01-15T21:30:00Z", estimated_hours:3.5, status:"PENDING"}}
         */
        it('UORTC05: Update overtime request with multiple fields', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                start_time: '2025-01-15T18:30:00Z',
                end_time: '2025-01-15T21:30:00Z',
                estimated_hours: 3.5,
            };

            const existingRequest = createMockOvertimeRequest();
            const updatedRequest = {
                ...existingRequest,
                start_time: new Date(dto.start_time!),
                end_time: new Date(dto.end_time!),
                estimated_hours: dto.estimated_hours,
                updated_at: new Date(),
            };

            setupUpdateOvertimeMocks(mocks, existingRequest, updatedRequest);

            // Act
            const result = await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectOvertimeData(result.data, {
                employee_id: MOCK_EMPLOYEE_ID,
                start_time: new Date(dto.start_time!),
                end_time: new Date(dto.end_time!),
                estimated_hours: 3.5,
            });
            expectRepositoryCalls(mocks.mockOvertimeRepo, 1);
        });

        /**
         * @id UORTC06
         * @description Throw error when overtime request status is APPROVED
         * @type A
         * @output "Cannot update request that is already approved/rejected."
         */
        it('UORTC06: Throw error when overtime request status is APPROVED', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                reason: 'Updated reason',
            };

            const approvedRequest = createMockOvertimeRequest({
                status: OvertimeStatus.APPROVED,
                approved_by: 10,
                approved_at: new Date(),
            });

            setupUpdateOvertimeMocks(mocks, approvedRequest);

            // Act & Assert
            await expect(useCase.execute(1, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(1, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.INVALID_STATE_TRANSITION);
                expect((error as BusinessException).message).toBe(
                    'Cannot update request that is already approved/rejected.'
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockOvertimeRepo.updateRequest).not.toHaveBeenCalled();
        });

        /**
         * @id UORTC07
         * @description Throw error when overtime request status is REJECTED
         * @type A
         * @output "Cannot update request that is already approved/rejected."
         */
        it('UORTC07: Throw error when overtime request status is REJECTED', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                reason: 'Updated reason',
            };

            const rejectedRequest = createMockOvertimeRequest({
                status: OvertimeStatus.REJECTED,
                rejected_by: 10,
                rejected_at: new Date(),
                rejection_reason: 'Not aligned with policy',
            });

            setupUpdateOvertimeMocks(mocks, rejectedRequest);

            // Act & Assert
            await expect(useCase.execute(1, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(1, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.INVALID_STATE_TRANSITION);
                expect((error as BusinessException).message).toBe(
                    'Cannot update request that is already approved/rejected.'
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockOvertimeRepo.updateRequest).not.toHaveBeenCalled();
        });

        /**
         * @id UORTC08
         * @description Throw error when user tries to update another user's request
         * @type A
         * @output "You can only update your own requests."
         */
        it("UORTC08: Throw error when user tries to update another users request", async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                reason: 'Updated reason',
            };

            const existingRequest = createMockOvertimeRequest({
                employee_id: MOCK_EMPLOYEE_ID, // Request belongs to employee 100
            });

            setupUpdateOvertimeMocks(mocks, existingRequest);

            // Act & Assert - User with employee_id 200 trying to update
            await expect(useCase.execute(1, dto, MOCK_OTHER_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(1, dto, MOCK_OTHER_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.PERMISSION_DENIED);
                expect((error as BusinessException).message).toBe('You can only update your own requests.');
                expect((error as BusinessException).statusCode).toBe(403);
            }

            expect(mocks.mockOvertimeRepo.updateRequest).not.toHaveBeenCalled();
        });

        /**
         * @id UORTC09
         * @description Throw error when overtime request not found
         * @type A
         * @output "Overtime request not found"
         */
        it('UORTC09: Throw error when overtime request not found', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                reason: 'Updated reason',
            };

            setupUpdateOvertimeMocks(mocks, null);

            // Act & Assert
            await expect(useCase.execute(999, dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(999, dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.NOT_FOUND);
                expect((error as BusinessException).message).toBe('Overtime request not found');
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockOvertimeRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
            expect(mocks.mockOvertimeRepo.updateRequest).not.toHaveBeenCalled();
        });

        /**
         * @id UORTC10
         * @description Convert date strings to Date objects in update data
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Overtime request updated successfully", data:{id:1, employee_id:100, start_time:Date, end_time:Date, status:"PENDING"}}
         */
        it('UORTC10: Convert date strings to Date objects in update data', async () => {
            // Arrange
            const dto: UpdateOvertimeRequestDto = {
                start_time: '2025-01-15T18:30:00Z',
                end_time: '2025-01-15T21:30:00Z',
            };

            const existingRequest = createMockOvertimeRequest();
            setupUpdateOvertimeMocks(mocks, existingRequest);

            // Act
            await useCase.execute(1, dto, MOCK_USER);

            // Assert
            expect(mocks.mockOvertimeRepo.updateRequest).toHaveBeenCalled();
            const updateCall = mocks.mockOvertimeRepo.updateRequest.mock.calls[0];
            const updateData = updateCall[1];

            expect(updateData.start_time).toBeInstanceOf(Date);
            expect(updateData.end_time).toBeInstanceOf(Date);
            expect(updateData.start_time.toISOString()).toBe('2025-01-15T18:30:00.000Z');
            expect(updateData.end_time.toISOString()).toBe('2025-01-15T21:30:00.000Z');
        });
    });
});

