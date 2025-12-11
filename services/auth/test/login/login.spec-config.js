module.exports = {
    preconditions: [
        { label: 'Can connect to database', check: () => true },
        { label: "Account with email 'active@company.com' EXISTS with status ACTIVE", check: (code) => code.includes('createMockAccount') && !code.includes("email: 'inactive") && !code.includes("email: 'locked") && !code.includes("email: 'suspended") && !code.includes("email: 'unknown") },
        { label: "Account with email 'inactive@company.com' EXISTS with status INACTIVE", check: (code) => code.includes("email: 'inactive@company.com'") || code.includes('AccountStatus.INACTIVE') },
        { label: "Account with email 'locked@company.com' EXISTS with status LOCKED", check: (code) => code.includes("email: 'locked@company.com'") || code.includes('AccountStatus.LOCKED') },
        { label: "Account with email 'suspended@company.com' EXISTS with status SUSPENDED", check: (code) => code.includes("email: 'suspended@company.com'") || code.includes('AccountStatus.SUSPENDED') },
        { label: "Account with email 'unknown_status@company.com' EXISTS with status UNKNOWN", check: (code) => code.includes("email: 'unknown_status@company.com'") },
        { label: "Account has failed_login_attempts = 0", check: (code) => code.includes('failed_login_attempts: 0') || (code.includes('createMockAccount') && !code.includes('failed_login_attempts:')) },
        { label: "Account has failed_login_attempts = 2", check: (code) => code.includes('failed_login_attempts: 2') },
        { label: "Account has failed_login_attempts = 3", check: (code) => code.includes('failed_login_attempts: 3') },
        { label: "Account has failed_login_attempts = 4", check: (code) => code.includes('failed_login_attempts: 4') },
        { label: "Account has failed_login_attempts = 5", check: (code) => code.includes('failed_login_attempts: 5') },
        { label: "Account has locked_until in future", check: (code) => code.includes('locked_until: futureDate') },
        { label: "Account has locked_until in past", check: (code) => code.includes('locked_until: pastDate') },
        { label: "Account has active temporary password (must_change_password = true)", check: (code) => code.includes('must_change_password: true') },
        { label: "Account has active temporary password (must_change_password = false)", check: (code) => code.includes('must_change_password: false') },
        { label: "Account has expired temporary password", check: (code) => code.includes('is_used: true') || code.includes('expires_at: pastDate') },
        { label: "Account has active temp password but using regular password", check: (code) => code.includes('setupLoginMocks(mocks, account, tempPassword, true)') && code.includes("password: 'correct_password'") },
        { label: "Account is DEPARTMENT_MANAGER with employee_id", check: (code) => code.includes('role: AccountRole.DEPARTMENT_MANAGER') || code.includes("role: 'DEPARTMENT_MANAGER'") },
        { label: "Account has null full_name", check: (code) => code.includes('full_name: null') },
        { label: "Account has null role", check: (code) => code.includes('role: null') },
        { label: "Device session creation succeeds", check: (code) => !code.includes('mockCreateDeviceSessionUseCase.execute.mockRejectedValue') },
        { label: "Device session creation fails", check: (code) => code.includes('mockCreateDeviceSessionUseCase.execute.mockRejectedValue') },
        { label: "Device tracking (logDeviceActivity) fails", check: (code) => code.includes('mockLogDeviceActivityUseCase.execute.mockRejectedValue') },
        { label: "getManagedDepartmentIds succeeds", check: (code) => code.includes('mockEmployeeProfileService.getManagedDepartmentIds.mockResolvedValue') && !code.includes('mockRejectedValue') },
        { label: "getManagedDepartmentIds fails", check: (code) => code.includes('mockEmployeeProfileService.getManagedDepartmentIds.mockRejectedValue') },
    ],
    inputs: [
        {
            header: 'email',
            values: [
                { label: '""active@company.com""', check: (code) => code.includes("email: 'active@company.com'") || (code.includes('createLoginRequest') && !code.includes("email: 'inactive") && !code.includes("email: 'locked") && !code.includes("email: 'suspended") && !code.includes("email: 'unknown") && !code.includes("email: 'nonexistent")) },
                { label: '""inactive@company.com""', check: (code) => code.includes("email: 'inactive@company.com'") },
                { label: '""locked@company.com""', check: (code) => code.includes("email: 'locked@company.com'") },
                { label: '""suspended@company.com""', check: (code) => code.includes("email: 'suspended@company.com'") },
                { label: '""unknown_status@company.com""', check: (code) => code.includes("email: 'unknown_status@company.com'") },
                { label: '""nonexistent@company.com""', check: (code) => code.includes("email: 'nonexistent@company.com'") },
            ]
        },
        {
            header: 'password',
            values: [
                { label: '""correct_password""', check: (code) => code.includes("password: 'correct_password'") || (code.includes('createLoginRequest') && !code.includes("password: 'wrong") && !code.includes("password: 'temp")) },
                { label: '""wrong_password""', check: (code) => code.includes("password: 'wrong_password'") },
                { label: '""temp_password123""', check: (code) => code.includes("password: 'temp_password123'") },
            ]
        },
        {
            header: 'device_id',
            values: [
                { label: '""device_123""', check: (code) => code.includes('MOCK_DEVICE_ID') || (code.includes('createLoginRequest') && !code.includes('device_id: undefined')) },
                { label: 'undefined', check: (code) => code.includes('device_id: undefined') },
            ]
        },
        {
            header: 'device_name',
            values: [
                { label: '""iPhone 14""', check: (code) => code.includes("'iPhone 14'") || (code.includes('createLoginRequest') && !code.includes('device_name: undefined') && !code.includes("'Samsung Galaxy S23'")) },
                { label: '""Samsung Galaxy S23""', check: (code) => code.includes("'Samsung Galaxy S23'") },
                { label: 'undefined', check: (code) => code.includes('device_name: undefined') },
            ]
        },
        {
            header: 'device_os',
            values: [
                { label: '""iOS 17""', check: (code) => code.includes("'iOS 17'") || (code.includes('createLoginRequest') && !code.includes('device_os: undefined') && !code.includes("'Android 14'")) },
                { label: '""Android 14""', check: (code) => code.includes("'Android 14'") },
                { label: 'undefined', check: (code) => code.includes('device_os: undefined') },
            ]
        },
        {
            header: 'platform',
            values: [
                { label: 'ANDROID', check: (code) => code.includes('DevicePlatform.ANDROID') || (code.includes('createLoginRequest') && !code.includes('platform: undefined')) },
                { label: 'undefined', check: (code) => code.includes('platform: undefined') },
            ]
        },
        {
            header: 'fcm_token',
            values: [
                { label: '""fcm_token_xyz""', check: (code) => code.includes('MOCK_FCM_TOKEN') || (code.includes('createLoginRequest') && !code.includes('fcm_token: undefined')) },
            ]
        },
        {
            header: 'ip_address',
            values: [
                { label: '""192.168.1.100""', check: (code) => code.includes('MOCK_IP_ADDRESS') && !code.includes('ipAddress: undefined') },
                { label: 'undefined', check: (code) => code.includes('ipAddress: undefined') || code.includes('execute(loginDto, undefined') },
            ]
        },
        {
            header: 'user_agent',
            values: [
                { label: '""Mozilla/5.0 (iPhone)""', check: (code) => code.includes('MOCK_USER_AGENT') },
            ]
        },
        {
            header: 'location',
            values: [
                { label: '"{latitude: 10.762622, longitude: 106.660172}"', check: (code) => code.includes('MOCK_LOCATION') },
            ]
        },
        {
            header: 'role',
            values: [
                { label: 'EMPLOYEE', check: (code) => code.includes('role: AccountRole.EMPLOYEE') || (code.includes('createMockAccount') && !code.includes('role:')) },
                { label: 'ADMIN', check: (code) => code.includes('role: AccountRole.ADMIN') },
                { label: 'HR_MANAGER', check: (code) => code.includes('role: AccountRole.HR_MANAGER') },
                { label: 'DEPARTMENT_MANAGER', check: (code) => code.includes('role: AccountRole.DEPARTMENT_MANAGER') },
                { label: 'null', check: (code) => code.includes('role: null') },
            ]
        },
        {
            header: 'employee_id',
            values: [
                { label: '100', check: (code) => code.includes('employee_id: 100') || (code.includes('createMockAccount') && !code.includes('employee_id:')) },
                { label: '200', check: (code) => code.includes('employee_id: 200') },
                { label: 'undefined', check: (code) => code.includes('employee_id: undefined') },
            ]
        },
        {
            header: 'full_name',
            values: [
                { label: '""John Doe""', check: (code) => code.includes("full_name: 'John Doe'") || (code.includes('createMockAccount') && !code.includes('full_name:')) },
                { label: '""John Admin""', check: (code) => code.includes("full_name: 'John Admin'") },
                { label: '""Jane Manager""', check: (code) => code.includes("full_name: 'Jane Manager'") },
                { label: 'null', check: (code) => code.includes('full_name: null') },
            ]
        },
    ],
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
