namespace Zentry.SharedKernel.Constants.Response;

public static class ErrorMessages
{
    // Common validation messages
    public const string RequestBodyRequired = "Dữ liệu yêu cầu không được để trống";
    public const string InvalidDataFormat = "Định dạng dữ liệu không hợp lệ";
    public const string GuidFormatInvalid = "ID phải có định dạng hợp lệ (ví dụ: 12345678-1234-1234-1234-123456789abc)";

    public const string InvalidInput = "Dữ liệu yêu cầu không hợp lệ.";
    public const string InvalidFileFormat = "Định dạng file không hợp lệ.";


    // Setting specific messages
    public static class Settings
    {
        public const string AttributeDefinitionRequired = "Thông tin định nghĩa thuộc tính là bắt buộc";
        public const string KeyRequired = "Key là bắt buộc";
        public const string DisplayNameRequired = "Tên hiển thị là bắt buộc";
        public const string DataTypeRequired = "Kiểu dữ liệu là bắt buộc";
        public const string ScopeTypeRequired = "Loại phạm vi là bắt buộc";
        public const string SettingDetailsRequired = "Thông tin cài đặt là bắt buộc";
        public const string SettingScopeTypeRequired = "Loại phạm vi cài đặt là bắt buộc";
        public const string ScopeIdRequired = "ID phạm vi là bắt buộc";
        public const string ValueRequired = "Giá trị cài đặt là bắt buộc";

        public const string InvalidAttributeDefinitionDataTypeOrScopeType =
            "Kiểu dữ liệu hoặc loại phạm vi định nghĩa thuộc tính không hợp lệ.";

        public const string InvalidSettingScope = "Phạm vi định nghĩa cho setting không hợp lệ.";
        public const string InvalidSettingValue = "Giá trị cho setting không hợp lệ.";
        public const string AttributeDefinitionKeyAlreadyExists = "Định nghĩa thuộc tính với Key '{0}' đã tồn tại.";

        public const string InvalidSettingValueForAttribute =
            "Giá trị '{0}' không hợp lệ cho thuộc tính '{1}' (Kiểu dữ liệu: {2}).";

        public const string SelectionDataTypeRequiresOptions =
            "Định nghĩa thuộc tính với Kiểu dữ liệu 'Selection' yêu cầu phải có tùy chọn.";

        public const string SettingExistsForAttributeScope =
            "Cài đặt cho thuộc tính '{0}' với phạm vi '{1}' và ID '{2}' đã tồn tại.";
    }

    // User specific messages
    public static class Users
    {
        public const string UserNotFound = "Không tìm thấy người dùng";
        public const string EmailRequired = "Email là bắt buộc";
        public const string PasswordRequired = "Mật khẩu là bắt buộc";
        public const string UserAlreadyExists = "Người dùng đã tồn tại";
    }

    // Device specific messages
    public static class Devices
    {
        public const string DeviceNotFound = "Không tìm thấy thiết bị";
        public const string DeviceNameRequired = "Tên thiết bị là bắt buộc";
        public const string DeviceAlreadyRegistered = "Thiết bị đã được đăng ký";
    }

    // Authentication messages
    public static class Authentication
    {
        public const string InvalidCredentials = "Email hoặc mật khẩu không chính xác";
        public const string AccountNotFound = "Tài khoản không tồn tại";
        public const string AccountInactive = "Tài khoản chưa được kích hoạt";
        public const string AccountLocked = "Tài khoản đã bị khóa";
        public const string AccountDisabled = "Tài khoản đã bị vô hiệu hóa";
        public const string TokenExpired = "Token đã hết hạn";
        public const string EmailNotConfirmed = "Email chưa được xác nhận";
        public const string TwoFactorRequired = "Yêu cầu xác thực hai yếu tố";
        public const string PasswordResetRequired = "Yêu cầu đặt lại mật khẩu";
        public const string ServerError = "Có lỗi xảy ra phía server";
    }

    public static class Attendance
    {
        public const string SessionEnded = "Phiên điểm danh đã kết thúc, dữ liệu quét không được chấp nhận.";
        public const string SessionNotActive = "Phiên điểm danh chưa ở trạng thái hoạt động.";
        public const string SessionNotActiveOrComplete = "Phiên điểm danh chưa ở trạng thái hoạt động hoặc hoàn thành.";
        public const string SessionNotFound = "Phiên điểm danh không tồn tại.";
        public const string SessionCancelled = "Phiên điểm danh đã bị hủy.";
        public const string SessionMissed = "Phiên điểm danh đã bị bỏ lỡ.";
        public const string SessionEndedGracePeriodExpired = "Phiên điểm danh đã kết thúc và hết thời gian gia hạn.";
    }
}