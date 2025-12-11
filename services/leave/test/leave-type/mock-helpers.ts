import { ILeaveTypeRepository } from '../../src/application/ports/leave-type.repository.interface';
import { LeaveTypeEntity } from '../../src/domain/entities/leave-type.entity';
import { LeaveTypeStatus, ProrationBasis } from '../../src/application/leave-type/dto/leave-type.dto';

// ============================================================================
// COMMON TEST DATA
// ============================================================================

export const MOCK_LEAVE_TYPE_CODE = 'ANNUAL';
export const MOCK_LEAVE_TYPE_NAME = 'Annual Leave';

export const createMockLeaveType = (overrides = {}): LeaveTypeEntity => {
    return new LeaveTypeEntity({
        id: 1,
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
        status: LeaveTypeStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
    });
};

// ============================================================================
// MOCK HELPERS
// ============================================================================

export interface MockRepositories {
    mockLeaveTypeRepository: jest.Mocked<ILeaveTypeRepository>;
}

export const setupCreateLeaveTypeMocks = (
    mocks: MockRepositories,
    existingLeaveType: LeaveTypeEntity | null = null,
    createdLeaveType?: LeaveTypeEntity
) => {
    jest.clearAllMocks();

    mocks.mockLeaveTypeRepository.findByCode.mockResolvedValue(existingLeaveType);

    if (createdLeaveType) {
        mocks.mockLeaveTypeRepository.create.mockResolvedValue(createdLeaveType);
    } else {
        mocks.mockLeaveTypeRepository.create.mockImplementation(async (dto) => createMockLeaveType(dto));
    }
};

export const expectSuccessResponse = (result: any) => {
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.leave_type_code).toBeDefined();
};
