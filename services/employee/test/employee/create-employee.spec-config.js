module.exports = {
    preconditions: [
        { label: 'Basic create setup (no existing code/email)', check: (code) => code.includes('setupTestMocks(savedEmployee') && !code.includes('mockPositionWithoutRole') && !code.includes('mockEmployeeRepository.findByCode.mockResolvedValue(existingEmployee)') && !code.includes('mockEmployeeRepository.findByEmail.mockResolvedValue(existingEmployee)') },
        { label: 'Position exists with suggested role', check: (code) => code.includes('setupTestMocks(savedEmployee, COMMON_POSITION)') },
        { label: 'Position exists WITHOUT suggested role', check: (code) => code.includes('setupTestMocks(savedEmployee, mockPositionWithoutRole)') },
        { label: 'Employee code already exists', check: (code) => code.includes('mockEmployeeRepository.findByCode.mockResolvedValue(existingEmployee)') },
        { label: 'Email already exists', check: (code) => code.includes('mockEmployeeRepository.findByEmail.mockResolvedValue(existingEmployee)') },
        { label: 'Employee not linked to account (no account_id)', check: (code) => code.includes('createCommonSavedEmployee({ account_id: undefined })') },
        { label: 'No existing employees today (for auto-gen code)', check: (code) => code.includes('mockEmployeeRepository.findAll.mockResolvedValue([])') },
        { label: 'Existing employees today (for auto-gen code)', check: (code) => code.includes('mockEmployeeRepository.findAll.mockResolvedValue(existingEmployees)') },
    ],
    inputs: [
        {
            header: 'employee_code',
            values: [
                { label: '"EMP001"', check: (code) => code.includes("employee_code: 'EMP001'") || (code.includes('validCreateEmployeeDto') && !code.includes('delete (dtoWithoutCode as any).employee_code')) },
                { label: 'undefined (auto-generate)', check: (code) => code.includes('delete (dtoWithoutCode as any).employee_code') },
            ]
        },
        {
            header: 'email',
            values: [
                { label: '"john.doe@company.com"', check: (code) => code.includes("email: 'john.doe@company.com'") || (code.includes('validCreateEmployeeDto') && !code.includes("email: 'invalid") && !code.includes("email: 'test.user")) },
                { label: '"invalid-email-format"', check: (code) => code.includes("email: 'invalid-email-format'") },
                { label: '"test.user+tag@company.co.uk"', check: (code) => code.includes("email: 'test.user+tag@company.co.uk'") },
            ]
        },
        {
            header: 'phone_number',
            values: [
                { label: '"   " (empty/whitespace)', check: (code) => code.includes("phone_number: '   '") },
                { label: 'undefined', check: (code) => code.includes('phone_number: undefined') },
                { label: '"123456789" (9 digits)', check: (code) => code.includes("phone_number: '123456789'") },
                { label: '"09123456ab" (non-digits)', check: (code) => code.includes("phone_number: '09123456ab'") },
                { label: '"0912345678" (valid)', check: (code) => code.includes("phone_number: '0912345678'") },
            ]
        },
        {
            header: 'personal_email',
            values: [
                { label: 'undefined', check: (code) => !code.includes('personal_email:') },
                { label: '"invalid-personal-email"', check: (code) => code.includes("personal_email: 'invalid-personal-email'") },
            ]
        },
        {
            header: 'employment_type',
            values: [
                { label: 'FULL_TIME', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('employment_type:')) || code.includes("employment_type: 'FULL_TIME'") },
                { label: 'CONTRACT', check: (code) => code.includes("employment_type: 'CONTRACT'") },
            ]
        },
        {
            header: 'gender',
            values: [
                { label: 'MALE', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('gender:')) || code.includes("gender: 'MALE'") },
                { label: 'OTHER', check: (code) => code.includes("gender: 'OTHER'") },
            ]
        },
        {
            header: 'first_name',
            values: [
                { label: '"John"', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('first_name:')) || code.includes("first_name: 'John'") },
                { label: '"Nguyễn"', check: (code) => code.includes("first_name: 'Nguyễn'") },
                { label: '"Alexander"', check: (code) => code.includes("first_name: 'Alexander'") },
            ]
        },
        {
            header: 'last_name',
            values: [
                { label: '"Doe"', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('last_name:')) || code.includes("last_name: 'Doe'") },
                { label: '"Văn Thành"', check: (code) => code.includes("last_name: 'Văn Thành'") },
                { label: '"Montgomery-Williams"', check: (code) => code.includes("last_name: 'Montgomery-Williams'") },
            ]
        },
        {
            header: 'department_id',
            values: [
                { label: '1', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('department_id: undefined')) || (code.includes('department_id: 1') && !code.includes('department_id: undefined')) },
                { label: 'undefined', check: (code) => code.includes('department_id: undefined') },
            ]
        },
        {
            header: 'position_id',
            values: [
                { label: '1', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('position_id: undefined')) || (code.includes('position_id: 1') && !code.includes('position_id: undefined')) },
                { label: 'undefined', check: (code) => code.includes('position_id: undefined') },
            ]
        },
        {
            header: 'manager_id',
            values: [
                { label: '2', check: (code) => (code.includes('validCreateEmployeeDto') && !code.includes('manager_id: undefined')) || (code.includes('manager_id: 2') && !code.includes('manager_id: undefined')) },
                { label: 'undefined', check: (code) => code.includes('manager_id: undefined') },
            ]
        }
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
