module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'No duplicate holiday exists on target date', check: (code) => code.includes('setupCreateHolidayMocks(mocks, [])') },
        { label: 'PUBLIC_HOLIDAY exists on 2025-01-29', check: (code) => code.includes('holiday_type: HolidayType.PUBLIC_HOLIDAY') && code.includes('setupCreateHolidayMocks(mocks, [existingHoliday])') },
        { label: 'COMPANY_HOLIDAY exists on 2025-01-29', check: (code) => code.includes('holiday_type: HolidayType.COMPANY_HOLIDAY') && code.includes('setupCreateHolidayMocks(mocks, [existingHoliday])') },
        { label: 'Different holiday type exists on same date', check: (code) => code.includes('setupCreateHolidayMocks(mocks, [existingHoliday], createdHoliday)') },
    ],
    inputs: [
        {
            header: 'holiday_name',
            values: [
                { label: '"Lunar New Year"', check: (code) => code.includes("holiday_name: 'Lunar New Year'") },
            ]
        },
        {
            header: 'holiday_date',
            values: [
                { label: '"2025-01-29"', check: (code) => code.includes('MOCK_HOLIDAY_DATE') },
            ]
        },
        {
            header: 'holiday_type',
            values: [
                { label: 'PUBLIC_HOLIDAY', check: (code) => code.includes('holiday_type: HolidayType.PUBLIC_HOLIDAY') && code.includes('const dto:') },
                { label: 'COMPANY_HOLIDAY', check: (code) => code.includes('holiday_type: HolidayType.COMPANY_HOLIDAY') && code.includes('const dto:') },
                { label: 'REGIONAL_HOLIDAY', check: (code) => code.includes('holiday_type: HolidayType.REGIONAL_HOLIDAY') && code.includes('const dto:') },
                { label: 'RELIGIOUS_HOLIDAY', check: (code) => code.includes('holiday_type: HolidayType.RELIGIOUS_HOLIDAY') && code.includes('const dto:') },
            ]
        },
        {
            header: 'applies_to',
            values: [
                { label: 'ALL', check: (code) => code.includes('applies_to: HolidayAppliesTo.ALL') },
            ]
        },
        {
            header: 'is_recurring',
            values: [
                { label: 'false', check: (code) => code.includes('is_recurring: false') },
            ]
        },
        {
            header: 'is_mandatory',
            values: [
                { label: 'true', check: (code) => code.includes('is_mandatory: true') },
            ]
        },
        {
            header: 'is_paid',
            values: [
                { label: 'true', check: (code) => code.includes('is_paid: true') },
            ]
        },
        {
            header: 'can_work_for_ot',
            values: [
                { label: 'false', check: (code) => code.includes('can_work_for_ot: false') },
            ]
        },
        {
            header: 'year',
            values: [
                { label: '2025', check: (code) => code.includes('year: 2025') },
            ]
        },
        {
            header: 'description',
            values: [
                { label: '"National holiday celebrating Lunar New Year"', check: (code) => code.includes("description: 'National holiday celebrating Lunar New Year'") },
                { label: 'undefined', check: (code) => !code.includes('description:') },
            ]
        },
        {
            header: 'existing_holiday_type',
            values: [
                { label: 'none', check: (code) => code.includes('setupCreateHolidayMocks(mocks, [])') },
                { label: 'PUBLIC_HOLIDAY', check: (code) => code.includes('existingHoliday') && code.includes('holiday_type: HolidayType.PUBLIC_HOLIDAY') && !code.includes('const dto:') },
                { label: 'COMPANY_HOLIDAY', check: (code) => code.includes('existingHoliday') && code.includes('holiday_type: HolidayType.COMPANY_HOLIDAY') && !code.includes('const dto:') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
