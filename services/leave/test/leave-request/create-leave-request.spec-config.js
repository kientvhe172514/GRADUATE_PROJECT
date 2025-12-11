module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'Employee with ID 100 EXISTS', check: (code) => code.includes('MOCK_EMPLOYEE_ID') && !code.includes('execute(dto, 999)') },
        { label: 'Leave type with ID 1 EXISTS and is active', check: (code) => code.includes('MOCK_LEAVE_TYPE_ID') && !code.includes('leave_type_id: 999') },
        { label: 'Leave type deducts from balance', check: (code) => !code.includes('MOCK_LEAVE_TYPE_NO_DEDUCT') },
        { label: 'Leave type does NOT deduct from balance', check: (code) => code.includes('MOCK_LEAVE_TYPE_NO_DEDUCT') },
        { label: 'Leave balance EXISTS with 10 days remaining', check: (code) => code.includes('MOCK_LEAVE_BALANCE') && !code.includes('remaining_days: 2') && !code.includes('leaveBalance: null') },
        { label: 'Leave balance has only 2 days remaining', check: (code) => code.includes('remaining_days: 2') },
        { label: 'Leave balance does NOT exist', check: (code) => code.includes('leaveBalance: null') },
        { label: 'No overlapping leave requests exist', check: (code) => !code.includes('overlappingLeaves:') || code.includes('overlappingLeaves: []') },
        { label: 'Overlapping PENDING leave request exists', check: (code) => code.includes("status: 'PENDING'") && code.includes('overlappingLeaves:') },
        { label: 'Overlapping APPROVED leave request exists', check: (code) => code.includes("status: 'APPROVED'") && code.includes('overlappingLeaves:') },
        { label: 'Leave type with ID 999 does NOT exist', check: (code) => code.includes('leave_type_id: 999') },
        { label: 'Employee with ID 999 does NOT exist', check: (code) => code.includes('execute(dto, 999)') },
    ],
    inputs: [
        {
            header: 'employee_id',
            values: [
                { label: '100', check: (code) => !code.includes('execute(dto, 999)') },
                { label: '999', check: (code) => code.includes('execute(dto, 999)') },
            ]
        },
        {
            header: 'leave_type_id',
            values: [
                { label: '1', check: (code) => code.includes('MOCK_LEAVE_TYPE_ID') && !code.includes('leave_type_id: 999') },
                { label: '999', check: (code) => code.includes('leave_type_id: 999') },
            ]
        },
        {
            header: 'start_date',
            values: [
                { label: '"2025-03-10"', check: (code) => code.includes("start_date: '2025-03-10'") },
                { label: '"2025-03-14"', check: (code) => code.includes("start_date: '2025-03-14'") },
            ]
        },
        {
            header: 'end_date',
            values: [
                { label: '"2025-03-12"', check: (code) => code.includes("end_date: '2025-03-12'") },
                { label: '"2025-03-14"', check: (code) => code.includes("end_date: '2025-03-14'") },
                { label: '"2025-03-16"', check: (code) => code.includes("end_date: '2025-03-16'") },
                { label: '"2025-03-10"', check: (code) => code.includes("end_date: '2025-03-10'") },
            ]
        },
        {
            header: 'is_half_day_start',
            values: [
                { label: 'true', check: (code) => code.includes('is_half_day_start: true') },
                { label: 'false', check: (code) => code.includes('is_half_day_start: false') },
            ]
        },
        {
            header: 'is_half_day_end',
            values: [
                { label: 'true', check: (code) => code.includes('is_half_day_end: true') },
                { label: 'false', check: (code) => code.includes('is_half_day_end: false') },
            ]
        },
        {
            header: 'reason',
            values: [
                { label: '"Family emergency"', check: (code) => code.includes("reason: 'Family emergency'") },
            ]
        },
        {
            header: 'supporting_document_url',
            values: [
                { label: '"https://example.com/doc.pdf"', check: (code) => code.includes("supporting_document_url: 'https://example.com/doc.pdf'") },
                { label: 'undefined', check: (code) => !code.includes('supporting_document_url:') },
            ]
        },
        {
            header: 'total_calendar_days',
            values: [
                { label: '3', check: (code) => code.includes('total_calendar_days: 3') },
                { label: '5', check: (code) => code.includes('total_calendar_days: 5') },
                { label: '7', check: (code) => code.includes('total_calendar_days: 7') },
            ]
        },
        {
            header: 'total_working_days',
            values: [
                { label: '3', check: (code) => code.includes('total_working_days: 3') },
                { label: '4.5', check: (code) => code.includes('total_working_days: 4.5') || code.includes('toBe(4.5)') },
                { label: '5', check: (code) => code.includes('total_working_days: 5') },
            ]
        },
        {
            header: 'deducts_from_balance',
            values: [
                { label: 'true', check: (code) => !code.includes('MOCK_LEAVE_TYPE_NO_DEDUCT') },
                { label: 'false', check: (code) => code.includes('MOCK_LEAVE_TYPE_NO_DEDUCT') },
            ]
        },
        {
            header: 'remaining_balance',
            values: [
                { label: '10', check: (code) => code.includes('MOCK_LEAVE_BALANCE') && !code.includes('remaining_days: 2') },
                { label: '2', check: (code) => code.includes('remaining_days: 2') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
