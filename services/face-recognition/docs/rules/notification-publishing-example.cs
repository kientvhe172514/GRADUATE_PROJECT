// File: zentry-server/src/Zentry.Modules/ScheduleManagement/Zentry.Modules.ScheduleManagement.Application/Features/ConfirmAppointment/ConfirmAppointmentCommandHandler.cs
// ... (giả sử file và class này đã tồn tại)

using MassTransit;
using MediatR;
using Zentry.SharedKernel.Contracts.Events;

public class ConfirmAppointmentCommandHandler // : IRequestHandler<ConfirmAppointmentCommand, Result>
{
    private readonly IPublishEndpoint _publishEndpoint;
    // ... các dependencies khác

    public ConfirmAppointmentCommandHandler(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task Handle(/* ... request, cancellationToken ... */)
    {
        // ... logic xử lý xác nhận lịch hẹn ...
        
        var patientId = Guid.NewGuid(); // Lấy ID bệnh nhân từ request hoặc logic
        var appointmentDetails = "Lịch khám của bạn vào lúc 9h sáng mai đã được xác nhận.";

        // Sau khi xác nhận thành công, publish sự kiện
        await _publishEndpoint.Publish(new NotificationCreatedEvent
        {
            Title = "Lịch khám đã được xác nhận",
            Body = appointmentDetails,
            RecipientUserId = patientId,
            Type = NotificationType.All, // Gửi cả In-App và Push
            Data = new Dictionary<string, string>
            {
                { "screen", "AppointmentDetail" },
                { "appointmentId", "some-appointment-id" }
            }
        });
        
        // ... trả về kết quả thành công
    }
} 