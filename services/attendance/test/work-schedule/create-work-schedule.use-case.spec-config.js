module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: "Work schedule with name 'Standard Office Hours' EXISTS", check: (code) => code.includes("Standard Office Hours") },
        { label: "Work schedule with name 'Existing Schedule' EXISTS", check: (code) => code.includes("Existing Schedule") || code.includes('existingSchedule') },
        { label: 'No existing schedule with same name (findByName returns null)', check: (code) => code.includes('setupCreateWorkScheduleMocks(mocks, null') || code.includes("findByName.mockResolvedValue(null)") },
        { label: 'Current user is authenticated / provided', check: (code) => code.includes('MOCK_USER') || code.includes('customUser') },
    ],
    inputs: [
        {
            header: 'schedule_name',
            values: [
                { label: '"Standard Office Hours"', check: (code) => code.includes("Standard Office Hours") },
                { label: '"Flexible Work Schedule"', check: (code) => code.includes("Flexible Work Schedule") },
                { label: '"Existing Schedule"', check: (code) => code.includes("Existing Schedule") },
                { label: '"Test Schedule"', check: (code) => code.includes("Test Schedule") },
            ]
        },
        {
            header: 'schedule_type',
            values: [
                { label: 'FIXED', check: (code) => code.includes('ScheduleType.FIXED') },
                { label: 'FLEXIBLE', check: (code) => code.includes('ScheduleType.FLEXIBLE') },
                { label: 'SHIFT_BASED', check: (code) => code.includes('ScheduleType.SHIFT_BASED') },
            ]
        },
        {
            header: 'work_days',
            values: [
                { label: '"1,2,3,4,5"', check: (code) => code.includes("'1,2,3,4,5'") || code.includes('1,2,3,4,5') || code.includes("work_days: '1,2,3,4,5'") },
                { label: 'undefined', check: (code) => code.includes('work_days: undefined') || code.includes('work_days: undefined') },
            ]
        },
        {
            header: 'start_time / end_time',
            values: [
                { label: '"08:00:00" / "17:00:00"', check: (code) => code.includes("08:00:00") && code.includes("17:00:00") },
                { label: 'undefined', check: (code) => code.includes('start_time: undefined') || code.includes('end_time: undefined') },
            ]
        },
        {
            header: 'break_duration_minutes',
            values: [
                { label: '60', check: (code) => code.includes('break_duration_minutes: 60') || code.includes('break_duration_minutes: dto.break_duration_minutes') },
                { label: 'undefined', check: (code) => !code.includes('break_duration_minutes:') },
            ]
        },
        {
            header: 'late_tolerance_minutes',
            values: [
                { label: '15', check: (code) => code.includes('late_tolerance_minutes: 15') || code.includes('late_tolerance_minutes: dto.late_tolerance_minutes') },
                { label: 'undefined', check: (code) => !code.includes('late_tolerance_minutes:') },
            ]
        },
        {
            header: 'early_leave_tolerance_minutes',
            values: [
                { label: '15', check: (code) => code.includes('early_leave_tolerance_minutes: 15') || code.includes('early_leave_tolerance_minutes: dto.early_leave_tolerance_minutes') },
                { label: 'undefined', check: (code) => !code.includes('early_leave_tolerance_minutes:') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
