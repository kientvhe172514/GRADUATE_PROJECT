import { Test, TestingModule } from '@nestjs/testing';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { CreateLeaveTypeUseCase } from '../../src/application/leave-type/use-cases/create-leave-type.use-case';
import { LEAVE_TYPE_REPOSITORY } from '../../src/application/tokens';
import { CreateLeaveTypeDto, LeaveTypeStatus, ProrationBasis } from '../../src/application/leave-type/dto/leave-type.dto';
import {
    createMockLeaveType,
    setupCreateLeaveTypeMocks,
    expectSuccessResponse,
    MockRepositories,
    MOCK_LEAVE_TYPE_CODE,
    MOCK_LEAVE_TYPE_NAME,
} from './mock-helpers';

describe('CreateLeaveTypeUseCase', () => {
    let useCase: CreateLeaveTypeUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        const mockLeaveTypeRepository = {
            create: jest.fn(),
            findByCode: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        mocks = {
            mockLeaveTypeRepository: mockLeaveTypeRepository as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateLeaveTypeUseCase,
                {
                    provide: LEAVE_TYPE_REPOSITORY,
                    useValue: mockLeaveTypeRepository,
                },
            ],
        }).compile();

        useCase = module.get<CreateLeaveTypeUseCase>(CreateLeaveTypeUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const createDto = (overrides = {}): CreateLeaveTypeDto => ({
        leave_type_code: MOCK_LEAVE_TYPE_CODE,
        leave_type_name: MOCK_LEAVE_TYPE_NAME,
        description: 'Standard annual leave',
        is_paid: true,
        requires_approval: true,
        requires_document: false,
        deducts_from_balance: true,
        max_days_per_year: 12,
        max_consecutive_days: 5,
        min_notice_days: 3,
        exclude_holidays: true,
        exclude_weekends: true,
        allow_carry_over: true,
        max_carry_over_days: 5,
        carry_over_expiry_months: 3,
        is_prorated: true,
        proration_basis: ProrationBasis.MONTHLY,
        is_accrued: true,
        accrual_rate: 1,
        accrual_start_month: 1,
        color_hex: '#FF0000',
        icon: 'calendar',
        sort_order: 1,
        ...overrides,
    });

    describe('execute', () => {
        /**
         * @id TC_01
         * @description Successful creation of leave type with all fields
         * @type N
         * @output {id:1, leave_type_code:"ANNUAL", leave_type_name:"Annual Leave", status:"ACTIVE"}
         */
        it('TC_01: Successful creation of leave type with all fields', async () => {
            // Arrange
            const dto = createDto();
            setupCreateLeaveTypeMocks(mocks, null);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectSuccessResponse(result);
            expect(result.leave_type_code).toBe(dto.leave_type_code);
            expect(mocks.mockLeaveTypeRepository.findByCode).toHaveBeenCalledWith(dto.leave_type_code);
            expect(mocks.mockLeaveTypeRepository.create).toHaveBeenCalledWith(dto);
        });

        /**
         * @id TC_02
         * @description Successful creation of leave type with minimal fields
         * @type N
         * @output {id:1, leave_type_code:"SICK", leave_type_name:"Sick Leave", status:"ACTIVE"}
         */
        it('TC_02: Successful creation of leave type with minimal fields', async () => {
            // Arrange
            const dto = createDto({
                leave_type_code: 'SICK',
                leave_type_name: 'Sick Leave',
                description: undefined,
                max_days_per_year: undefined,
                max_consecutive_days: undefined,
                max_carry_over_days: undefined,
                accrual_rate: undefined,
                icon: undefined,
            });
            setupCreateLeaveTypeMocks(mocks, null);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectSuccessResponse(result);
            expect(result.leave_type_code).toBe('SICK');
            expect(mocks.mockLeaveTypeRepository.create).toHaveBeenCalled();
        });

        /**
         * @id TC_03
         * @description Failed creation - Leave type code already exists
         * @type A
         * @output "Leave type code already exists"
         */
        it('TC_03: Failed creation - Leave type code already exists', async () => {
            // Arrange
            const dto = createDto();
            const existingLeaveType = createMockLeaveType();
            setupCreateLeaveTypeMocks(mocks, existingLeaveType);

            // Act & Assert
            await expect(useCase.execute(dto)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.LEAVE_TYPE_CODE_ALREADY_EXISTS);
            }

            expect(mocks.mockLeaveTypeRepository.create).not.toHaveBeenCalled();
        });

        /**
         * @id TC_04
         * @description Successful creation of unpaid leave type
         * @type N
         * @output {id:1, leave_type_code:"UNPAID", leave_type_name:"Unpaid Leave", status:"ACTIVE"}
         */
        it('TC_04: Successful creation of unpaid leave type', async () => {
            // Arrange
            const dto = createDto({
                leave_type_code: 'UNPAID',
                leave_type_name: 'Unpaid Leave',
                is_paid: false,
            });
            setupCreateLeaveTypeMocks(mocks, null);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectSuccessResponse(result);
            expect(result.leave_type_code).toBe('UNPAID');
            expect(result.is_paid).toBe(false); // This property might not be on the response DTO if not mapped, but let's assume it is based on DTO definition
            expect(mocks.mockLeaveTypeRepository.create).toHaveBeenCalledWith(expect.objectContaining({ is_paid: false }));
        });
    });
});
