module.exports = {
    preconditions: [
        { label: 'Leave type code does NOT exist', check: (code) => code.includes('setupCreateLeaveTypeMocks(mocks, null)') },
        { label: 'Leave type code ALREADY exists', check: (code) => code.includes('setupCreateLeaveTypeMocks(mocks, existingLeaveType)') },
    ],
    inputs: [
        {
            header: 'leave_type_code',
            values: [
                { label: '""ANNUAL""', check: (code) => code.includes('MOCK_LEAVE_TYPE_CODE') || (code.includes('createDto') && !code.includes("leave_type_code: 'SICK'") && !code.includes("leave_type_code: 'UNPAID'")) },
                { label: '""SICK""', check: (code) => code.includes("leave_type_code: 'SICK'") },
                { label: '""UNPAID""', check: (code) => code.includes("leave_type_code: 'UNPAID'") },
            ]
        },
        {
            header: 'leave_type_name',
            values: [
                { label: '""Annual Leave""', check: (code) => code.includes('MOCK_LEAVE_TYPE_NAME') || (code.includes('createDto') && !code.includes("leave_type_name: 'Sick Leave'") && !code.includes("leave_type_name: 'Unpaid Leave'")) },
                { label: '""Sick Leave""', check: (code) => code.includes("leave_type_name: 'Sick Leave'") },
                { label: '""Unpaid Leave""', check: (code) => code.includes("leave_type_name: 'Unpaid Leave'") },
            ]
        },
        {
            header: 'description',
            values: [
                { label: '""Standard annual leave""', check: (code) => code.includes('createDto') && !code.includes('description: undefined') },
                { label: 'undefined', check: (code) => code.includes('description: undefined') },
            ]
        },
        {
            header: 'is_paid',
            values: [
                { label: 'true', check: (code) => code.includes('createDto') && !code.includes('is_paid: false') },
                { label: 'false', check: (code) => code.includes('is_paid: false') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
