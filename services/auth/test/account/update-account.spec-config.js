module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: 'account_id 1 EXISTS', check: (code) => !code.includes('mockAccountRepository.findById.mockResolvedValue(null)') && !code.includes('useCase.execute(999') },
        { label: 'account_id 999 does NOT exist', check: (code) => code.includes('mockAccountRepository.findById.mockResolvedValue(null)') || code.includes('useCase.execute(999') },
        { label: "email 'new@company.com' does NOT exist", check: (code) => !code.includes('mockAccountRepository.findByEmail.mockResolvedValue') },
        { label: "email 'existing@company.com' ALREADY EXISTS", check: (code) => code.includes('mockAccountRepository.findByEmail.mockResolvedValue(anotherAccount)') },
        { label: "Role 'ADMIN' not found", check: (code) => code.includes('mockRoleRepository.findByCode.mockResolvedValue(null)') },
    ],
    inputs: [
        {
            header: 'account_id',
            values: [
                { label: '1', check: (code) => code.includes('useCase.execute(1') },
                { label: '999', check: (code) => code.includes('useCase.execute(999') },
            ]
        },
        {
            header: 'email',
            values: [
                { label: '""john.new@company.com""', check: (code) => code.includes("email: 'john.new@company.com'") },
                { label: '""john.different@company.com""', check: (code) => code.includes("email: 'john.different@company.com'") },
                { label: '""existing@company.com""', check: (code) => code.includes("email: 'existing@company.com'") },
                { label: 'undefined', check: (code) => !code.includes('email:') },
            ]
        },
        {
            header: 'role',
            values: [
                { label: 'HR_MANAGER', check: (code) => code.includes('role: AccountRole.HR_MANAGER') },
                { label: 'ADMIN', check: (code) => code.includes('role: AccountRole.ADMIN') || code.includes("role: 'ADMIN'") },
                { label: 'INVALID_ROLE', check: (code) => code.includes("role: 'INVALID_ROLE'") },
                { label: 'EMPLOYEE', check: (code) => !code.includes('role:') },
            ]
        },
        {
            header: 'status',
            values: [
                { label: 'ACTIVE', check: (code) => code.includes('status: AccountStatus.ACTIVE') },
                { label: 'INACTIVE', check: (code) => code.includes('status: AccountStatus.INACTIVE') },
                { label: 'undefined', check: (code) => !code.includes('status:') },
            ]
        },
        {
            header: 'employee_id',
            values: [
                { label: '101', check: (code) => code.includes('employee_id: 101') },
                { label: '999', check: (code) => code.includes('employee_id: 999') },
                { label: 'undefined', check: (code) => !code.includes('employee_id:') },
            ]
        },
        {
            header: 'employee_code',
            values: [
                { label: '""EMP002""', check: (code) => code.includes("employee_code: 'EMP002'") },
                { label: '""EMP999""', check: (code) => code.includes("employee_code: 'EMP999'") },
                { label: 'undefined', check: (code) => !code.includes('employee_code:') },
            ]
        },
        {
            header: 'full_name',
            values: [
                { label: '""John Updated Doe""', check: (code) => code.includes("full_name: 'John Updated Doe'") },
                { label: '""John Updated Only Name""', check: (code) => code.includes("full_name: 'John Updated Only Name'") },
                { label: '""John Different Email""', check: (code) => code.includes("full_name: 'John Different Email'") },
                { label: '""Updated Name""', check: (code) => code.includes("full_name: 'Updated Name'") },
                { label: '""Test Sync Version""', check: (code) => code.includes("full_name: 'Test Sync Version'") },
                { label: 'undefined', check: (code) => !code.includes('full_name:') },
            ]
        },
        {
            header: 'department_id',
            values: [
                { label: '20', check: (code) => code.includes('department_id: 20') },
                { label: '30', check: (code) => code.includes('department_id: 30') },
                { label: '50', check: (code) => code.includes('department_id: 50') },
                { label: 'undefined', check: (code) => !code.includes('department_id:') },
            ]
        },
        {
            header: 'department_name',
            values: [
                { label: '""Sales""', check: (code) => code.includes("department_name: 'Sales'") },
                { label: '""Human Resources""', check: (code) => code.includes("department_name: 'Human Resources'") },
                { label: 'undefined', check: (code) => !code.includes('department_name:') },
            ]
        },
        {
            header: 'position_id',
            values: [
                { label: '10', check: (code) => code.includes('position_id: 10') },
                { label: '20', check: (code) => code.includes('position_id: 20') },
                { label: 'undefined', check: (code) => !code.includes('position_id:') },
            ]
        },
        {
            header: 'position_name',
            values: [
                { label: '""Senior Engineer""', check: (code) => code.includes("position_name: 'Senior Engineer'") },
                { label: '""HR Manager""', check: (code) => code.includes("position_name: 'HR Manager'") },
                { label: 'undefined', check: (code) => !code.includes('position_name:') },
            ]
        },
        {
            header: 'external_ids',
            values: [
                { label: "{ldap_id:'12345'}", check: (code) => code.includes("ldap_id: '12345'") },
                { label: "{ldap_id:'99999', ad_id:'AD123'}", check: (code) => code.includes("ldap_id: '99999'") },
                { label: 'undefined', check: (code) => !code.includes('external_ids:') },
            ]
        },
        {
            header: 'metadata',
            values: [
                { label: "{note:'Updated user'}", check: (code) => code.includes("note: 'Updated user'") },
                { label: "{notes:'Important user', tags:['vip','manager']}", check: (code) => code.includes("notes: 'Important user'") },
                { label: 'undefined', check: (code) => !code.includes('metadata:') },
            ]
        },
    ],
    additionalHeaders: [
        { label: 'Log message' }
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
