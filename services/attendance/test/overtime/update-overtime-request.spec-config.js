module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'Overtime request with ID 1 EXISTS with status PENDING', check: (code) => code.includes('createMockOvertimeRequest()') && !code.includes('status: OvertimeStatus.APPROVED') && !code.includes('status: OvertimeStatus.REJECTED') },
        { label: 'Overtime request with ID 1 has status APPROVED', check: (code) => code.includes('status: OvertimeStatus.APPROVED') },
        { label: 'Overtime request with ID 1 has status REJECTED', check: (code) => code.includes('status: OvertimeStatus.REJECTED') },
        { label: 'Overtime request belongs to employee_id = 100', check: (code) => code.includes('employee_id: MOCK_EMPLOYEE_ID') || (code.includes('createMockOvertimeRequest') && !code.includes('employee_id: 200')) },
        { label: 'Current user has employee_id = 100', check: (code) => code.includes('MOCK_USER') && !code.includes('MOCK_OTHER_USER') },
        { label: 'Current user has employee_id = 200', check: (code) => code.includes('MOCK_OTHER_USER') },
        { label: 'Overtime request with ID 999 does NOT exist', check: (code) => code.includes('setupUpdateOvertimeMocks(mocks, null)') },
    ],
    inputs: [
        {
            header: 'request_id',
            values: [
                { label: '1', check: (code) => code.includes('execute(1,') },
                { label: '999', check: (code) => code.includes('execute(999,') },
            ]
        },
        {
            header: 'start_time',
            values: [
                { label: '"2025-01-15T18:30:00Z"', check: (code) => code.includes("start_time: '2025-01-15T18:30:00Z'") },
                { label: 'undefined', check: (code) => !code.includes('start_time:') || code.includes('start_time: undefined') },
            ]
        },
        {
            header: 'end_time',
            values: [
                { label: '"2025-01-15T21:30:00Z"', check: (code) => code.includes("end_time: '2025-01-15T21:30:00Z'") },
                { label: 'undefined', check: (code) => !code.includes('end_time:') || code.includes('end_time: undefined') },
            ]
        },
        {
            header: 'estimated_hours',
            values: [
                { label: '3.5', check: (code) => code.includes('estimated_hours: 3.5') },
                { label: 'undefined', check: (code) => !code.includes('estimated_hours:') || code.includes('estimated_hours: undefined') },
            ]
        },
        {
            header: 'reason',
            values: [
                { label: '"Extended due to additional tasks"', check: (code) => code.includes("reason: 'Extended due to additional tasks'") },
                { label: '"Updated reason"', check: (code) => code.includes("reason: 'Updated reason'") },
                { label: 'undefined', check: (code) => !code.includes('reason:') || code.includes('reason: undefined') },
            ]
        },
        {
            header: 'status',
            values: [
                { label: 'PENDING', check: (code) => code.includes('createMockOvertimeRequest()') && !code.includes('status: OvertimeStatus.APPROVED') && !code.includes('status: OvertimeStatus.REJECTED') },
                { label: 'APPROVED', check: (code) => code.includes('status: OvertimeStatus.APPROVED') },
                { label: 'REJECTED', check: (code) => code.includes('status: OvertimeStatus.REJECTED') },
            ]
        },
        {
            header: 'employee_id',
            values: [
                { label: '100', check: (code) => code.includes('employee_id: MOCK_EMPLOYEE_ID') || code.includes('employee_id: 100') },
                { label: '200', check: (code) => code.includes('employee_id: 200') },
            ]
        },
        {
            header: 'current_user_employee_id',
            values: [
                { label: '100', check: (code) => code.includes('MOCK_USER') && !code.includes('MOCK_OTHER_USER') },
                { label: '200', check: (code) => code.includes('MOCK_OTHER_USER') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
