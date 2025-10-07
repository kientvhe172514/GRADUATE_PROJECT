namespace Zentry.SharedKernel.Exceptions;

public class SelectionDataTypeRequiresOptionsException()
    : BusinessLogicException("Kiểu dữ liệu 'Selection' yêu cầu phải có ít nhất một tùy chọn (Option).");