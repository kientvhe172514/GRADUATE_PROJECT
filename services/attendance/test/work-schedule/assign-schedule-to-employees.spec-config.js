module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'Work schedule with ID 1 EXISTS', check: (code) => code.includes('scheduleId = 1') || code.includes('scheduleId: 1') },
        { label: 'Work schedule with ID 999 does NOT exist', check: (code) => code.includes('scheduleId = 999') },
        { label: 'Employee with ID 100 EXISTS', check: (code) => code.includes('employee_ids: [100]') },
        { label: 'Employee with IDs [100, 101, 102] EXIST', check: (code) => code.includes('employee_ids: [100, 101, 102]') },
        { label: 'Employee 100 has NO existing schedule assignments', check: (code) => code.includes('setupAssignScheduleMocks(mocks, workSchedule, [])') || code.includes('setupAssignScheduleMocks(mocks, newSchedule, [])') },
        { label: 'Employee 100 has existing assignment', check: (code) => code.includes('createMockEmployeeWorkSchedule') && code.includes('setupAssignScheduleMocks(mocks, newSchedule, [existingAssignment])') },
        { label: 'Existing assignment overlaps with new date range', check: (code) => code.includes('effective_from: new Date(\'2026-01-15\')') && code.includes('existingAssignment') },
        { label: 'Existing assignment DOES NOT overlap with new date range', check: (code) => code.includes('effective_to: new Date(\'2026-05-31\')') && code.includes('existingAssignment') },
        { label: 'Existing assignment has time conflict', check: (code) => code.includes('conflicts with the new schedule') },
        { label: 'Existing assignment has NO time conflict', check: (code) => code.includes('existingAssignment') && !code.includes('conflicts with the new schedule') && code.includes('expectAssignScheduleSuccess(result)') },
        { label: 'Current user is authenticated', check: (code) => code.includes('MOCK_USER') },
        { label: 'Orphaned existing schedule (ID 99)', check: (code) => code.includes('work_schedule_id: 99') },
        { label: 'Shift Generation fails', check: (code) => code.includes('mockShiftGeneratorService') && code.includes('mockRejectedValue') },
        { label: 'Shift Generation partial error', check: (code) => code.includes('Simulated partial error') },
        { label: 'Shift Generation critical failure', check: (code) => code.includes('generateInitialShifts') && code.includes('mockRejectedValue') },
    ],
    inputs: [
        {
            header: 'scheduleId',
            values: [
                { label: '1', check: (code) => code.includes('scheduleId = 1') || (code.includes('scheduleId:') && !code.includes('scheduleId = 999')) },
                { label: '999', check: (code) => code.includes('scheduleId = 999') },
            ]
        },
        {
            header: 'employee_ids',
            values: [
                { label: '[100]', check: (code) => code.includes('employee_ids: [100]') && !code.includes('employee_ids: [100, 101, 102]') },
                { label: '[100, 101, 102]', check: (code) => code.includes('employee_ids: [100, 101, 102]') },
            ]
        },
        {
            header: 'effective_from',
            values: [
                { label: '\"2026-01-15\"', check: (code) => code.includes('effective_from: \'2026-01-15\'') },
                { label: '\"2026-06-01\"', check: (code) => code.includes('effective_from: \'2026-06-01\'') },
                { label: '\"2020-01-01\"', check: (code) => code.includes('effective_from: \'2020-01-01\'') },
                { label: 'today', check: (code) => code.includes('const today = new Date()') || code.includes('effective_from: todayStr') },
                { label: '\"2026-01-01\"', check: (code) => code.includes('effective_from: \'2026-01-01\'') },
            ]
        },
        {
            header: 'effective_to',
            values: [
                { label: 'undefined', check: (code) => code.includes('effective_to: undefined') },
                { label: '\"2026-12-31\"', check: (code) => code.includes('effective_to: \'2026-12-31\'') },
                { label: '\"2026-05-31\"', check: (code) => code.includes('effective_to: new Date(\'2026-05-31\')') },
                { label: '\"2026-01-10\"', check: (code) => code.includes('effective_to: \'2026-01-10\'') },
                { label: '\"2026-01-03\"', check: (code) => code.includes('effective_to: \'2026-01-03\'') },
            ]
        },
        {
            header: 'schedule_type',
            values: [
                { label: 'FIXED', check: (code) => code.includes('schedule_type: ScheduleType.FIXED') },
                { label: 'FLEXIBLE', check: (code) => code.includes('schedule_type: ScheduleType.FLEXIBLE') },
            ]
        },
        {
            header: 'start_time',
            values: [
                { label: '\"08:00:00\"', check: (code) => code.includes('start_time: \'08:00:00\'') },
            ]
        },
        {
            header: 'end_time',
            values: [
                { label: '\"17:00:00\"', check: (code) => code.includes('end_time: \'17:00:00\'') },
                { label: '\"12:00:00\"', check: (code) => code.includes('end_time: \'12:00:00\'') },
            ]
        },
        {
            header: 'existing_schedule_start_time',
            values: [
                { label: 'N/A', check: (code) => !code.includes('existingSchedule') },
                { label: '\"09:00:00\"', check: (code) => code.includes('start_time: \'09:00:00\'') },
                { label: '\"13:00:00\"', check: (code) => code.includes('start_time: \'13:00:00\'') },
            ]
        },
        {
            header: 'existing_schedule_end_time',
            values: [
                { label: 'N/A', check: (code) => !code.includes('existingSchedule') },
                { label: '\"18:00:00\"', check: (code) => code.includes('end_time: \'18:00:00\'') },
                { label: '\"17:00:00\"', check: (code) => code.includes('end_time: \'17:00:00\'') && code.includes('existingSchedule') },
            ]
        },
        {
            header: 'existing_assignment_effective_from',
            values: [
                { label: 'N/A', check: (code) => !code.includes('existingAssignment') },
                { label: '\"2026-01-15\"', check: (code) => code.includes('effective_from: new Date(\'2026-01-15\')') && code.includes('existingAssignment') },
                { label: '\"2026-01-01\"', check: (code) => code.includes('effective_from: new Date(\'2026-01-01\')') && code.includes('existingAssignment') },
                { label: '\"2026-02-01\"', check: (code) => code.includes('effective_from: new Date(\'2026-02-01\')') && code.includes('existingAssignment') },
            ]
        },
        {
            header: 'existing_assignment_effective_to',
            values: [
                { label: 'N/A', check: (code) => !code.includes('existingAssignment') },
                { label: '\"2026-12-31\"', check: (code) => code.includes('effective_to: new Date(\'2026-12-31\')') && code.includes('existingAssignment') },
                { label: '\"2026-05-31\"', check: (code) => code.includes('effective_to: new Date(\'2026-05-31\')') && code.includes('existingAssignment') },
                { label: '\"2026-02-28\"', check: (code) => code.includes('effective_to: new Date(\'2026-02-28\')') && code.includes('existingAssignment') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
