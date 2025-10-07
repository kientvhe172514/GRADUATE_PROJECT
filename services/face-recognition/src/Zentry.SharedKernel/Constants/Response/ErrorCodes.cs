namespace Zentry.SharedKernel.Constants.Response;

public static class ErrorCodes
{
    public const string RateLimitExceeded = "RATE_LIMIT_EXCEEDED";

    // General errors
    public const string ValidationError = "VALIDATION_ERROR";
    public const string InternalServerError = "INTERNAL_SERVER_ERROR";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";

    // Resource errors
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";
    public const string ResourceAlreadyExists = "RESOURCE_ALREADY_EXISTS";

    // User management
    public const string UserNotFound = "USER_NOT_FOUND";
    public const string UserAlreadyExists = "USER_ALREADY_EXISTS";
    public const string AccountNotFound = "ACCOUNT_NOT_FOUND";

    // Business logic
    public const string BusinessRuleError = "BUSINESS_RULE_ERROR";
    public const string BusinessLogicError = "BUSINESS_LOGIC_ERROR";
    public const string InvalidOperation = "INVALID_OPERATION";

    // Configuration
    public const string ConfigurationError = "CONFIGURATION_ERROR";
    public const string SettingNotFound = "SETTING_NOT_FOUND";
    public const string InvalidAttributeDefinitionType = "INVALID_ATTRIBUTE_DEFINITION_TYPE";
    public const string AttributeDefinitionKeyExists = "ATTRIBUTE_DEFINITION_KEY_EXISTS";
    public const string InvalidSettingValue = "INVALID_SETTING_VALUE";
    public const string InvalidSettingScope = "INVALID_SETTING_SCOPE";
    public const string SelectionOptionsRequired = "SELECTION_OPTIONS_REQUIRED";
    public const string SettingAlreadyExists = "SETTING_ALREADY_EXISTS";
    public const string DuplicateOptionLabel = "DUPLICATE_OPTION_LABEL";

    // Schedule management
    public const string ScheduleConflict = "SCHEDULE_CONFLICT";
    public const string CourseCannotBeDeleted = "COURSE_CAN_NOT_BE_DELETED";
    public const string ClassSectionNotFound = "CLASS_SECTION_NOT_FOUND";
    public const string RoomNotAvailable = "ROOM_NOT_AVAILABLE";

    // Device management
    public const string DeviceAlreadyRegistered = "DEVICE_ALREADY_REGISTERED";
    public const string DeviceNotFound = "DEVICE_NOT_FOUND";

    // Attendance
    public const string SessionNotFound = "SESSION_NOT_FOUND";
    public const string SessionAlreadyStarted = "SESSION_ALREADY_STARTED";
    public const string AttendanceCalculationFailed = "ATTENDANCE_CALCULATION_FAILED";
    public const string SessionEnded = "SESSION_ENDED";
    public const string SessionNotActiveOrComplete = "SESSION_NOT_ACTIVE_OR_COMPLETE";
    public const string SessionNotActive = "SESSION_NOT_ACTIVE";

    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string AccountInactive = "ACCOUNT_INACTIVE";
    public const string AccountLocked = "ACCOUNT_LOCKED";
    public const string AccountDisabled = "ACCOUNT_DISABLED";
    public const string TokenExpired = "TOKEN_EXPIRED";
    public const string EmailNotConfirmed = "EMAIL_NOT_CONFIRMED";
    public const string TwoFactorRequired = "TWO_FACTOR_REQUIRED";
    public const string PasswordResetRequired = "PASSWORD_RESET_REQUIRED";
    public const string SessionCancelled = "SESSION_CANCELLED";

    public const string SessionMissed = "SESSION_MISSED";

    // File
    public const string InvalidInput = "INVALID_INPUT";
    public const string InvalidFileFormat = "INVALID_FILE_FORMAT";
}