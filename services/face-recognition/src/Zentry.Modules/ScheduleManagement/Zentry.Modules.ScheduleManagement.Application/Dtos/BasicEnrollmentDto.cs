namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class BasicEnrollmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string Status { get; set; }
}