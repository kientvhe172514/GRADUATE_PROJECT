module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'Shift with ID 1 EXISTS with status IN_PROGRESS', check: (code) => code.includes('createMockEmployeeShift()') && !code.includes('status: ShiftStatus.ABSENT') },
        { label: 'Shift with ID 1 has status ABSENT', check: (code) => code.includes('status: ShiftStatus.ABSENT') },
        { label: 'Shift has existing notes', check: (code) => code.includes("notes: 'Old notes'") },
        { label: 'Shift has null notes', check: (code) => code.includes('notes: null') },
        { label: 'Shift with ID 999 does NOT exist', check: (code) => code.includes('setupManualEditShiftMocks(mocks, null)') },
        { label: 'User has permission to edit shifts', check: (code) => code.includes('MOCK_USER') },
        { label: 'Edit reason is provided', check: (code) => code.includes('edit_reason:') },
    ],
    inputs: [
        {
            header: 'shift_id',
            values: [
                { label: '1', check: (code) => code.includes('execute(1,') },
                { label: '999', check: (code) => code.includes('execute(999,') },
            ]
        },
        {
            header: 'check_in_time',
            values: [
                { label: '"2025-01-01T08:30:00.000Z"', check: (code) => code.includes("check_in_time: '2025-01-01T08:30:00.000Z'") },
                { label: '"2025-01-01T08:00:00.000Z"', check: (code) => code.includes("check_in_time: '2025-01-01T08:00:00.000Z'") },
                { label: 'undefined', check: (code) => !code.includes('check_in_time:') || code.includes('check_in_time: undefined') },
            ]
        },
        {
            header: 'check_out_time',
            values: [
                { label: '"2025-01-01T17:30:00.000Z"', check: (code) => code.includes("check_out_time: '2025-01-01T17:30:00.000Z'") },
                { label: '"2025-01-01T17:00:00.000Z"', check: (code) => code.includes("check_out_time: '2025-01-01T17:00:00.000Z'") },
                { label: 'undefined', check: (code) => !code.includes('check_out_time:') || code.includes('check_out_time: undefined') },
            ]
        },
        {
            header: 'status',
            values: [
                { label: 'IN_PROGRESS', check: (code) => code.includes('status: ShiftStatus.IN_PROGRESS') },
                { label: 'ABSENT', check: (code) => code.includes('status: ShiftStatus.ABSENT') },
                { label: 'undefined', check: (code) => !code.includes('status: ShiftStatus') || code.includes('status: undefined') },
            ]
        },
        {
            header: 'notes',
            values: [
                { label: '"Adjusted due to forgot check-in"', check: (code) => code.includes("notes: 'Adjusted due to forgot check-in'") },
                { label: '"Updated notes"', check: (code) => code.includes("notes: 'Updated notes'") },
                { label: 'undefined', check: (code) => !code.includes("notes: '") || code.includes('notes: undefined') },
            ]
        },
        {
            header: 'edit_reason',
            values: [
                { label: '"Employee forgot to check-in, HR corrected based on evidence"', check: (code) => code.includes("edit_reason: 'Employee forgot to check-in, HR corrected based on evidence'") },
            ]
        },
        {
            header: 'existing_check_in_time',
            values: [
                { label: '"2025-01-01T08:00:00.000Z"', check: (code) => code.includes("check_in_time: new Date('2025-01-01T08:00:00.000Z')") },
                { label: 'null', check: (code) => code.includes('check_in_time: null') },
            ]
        },
        {
            header: 'existing_check_out_time',
            values: [
                { label: '"2025-01-01T17:00:00.000Z"', check: (code) => code.includes("check_out_time: new Date('2025-01-01T17:00:00.000Z')") },
                { label: 'null', check: (code) => code.includes('check_out_time: null') },
            ]
        },
        {
            header: 'existing_status',
            values: [
                { label: 'IN_PROGRESS', check: (code) => code.includes('createMockEmployeeShift()') && !code.includes('status: ShiftStatus.ABSENT') },
                { label: 'ABSENT', check: (code) => code.includes('status: ShiftStatus.ABSENT') },
            ]
        },
        {
            header: 'existing_notes',
            values: [
                { label: 'null', check: (code) => code.includes('notes: null') },
                { label: '"Old notes"', check: (code) => code.includes("notes: 'Old notes'") },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
