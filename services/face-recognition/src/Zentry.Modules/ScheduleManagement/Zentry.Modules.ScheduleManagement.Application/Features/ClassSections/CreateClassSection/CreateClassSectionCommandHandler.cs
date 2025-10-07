using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.CreateClassSection;

public class CreateClassSectionCommandHandler(
    IClassSectionRepository classSectionRepository,
    ICourseRepository courseRepository)
    : ICommandHandler<CreateClassSectionCommand, CreateClassSectionResponse>
{
    public async Task<CreateClassSectionResponse> Handle(CreateClassSectionCommand request,
        CancellationToken cancellationToken)
    {
        var semester = Semester.Create(request.Semester);

        var existingSection =
            await classSectionRepository.GetBySectionCodeAsync(request.SectionCode,
                cancellationToken);

        if (existingSection is not null)
            throw new BusinessRuleException("SECTION_CODE_DUPLICATE",
                $"Section Code '{request.SectionCode}' đã tồn tại trong học kỳ '{request.Semester}'.");

        var course = await courseRepository.GetByIdAsync(request.CourseId, cancellationToken);
        if (course is null) throw new ResourceNotFoundException("COURSE", request.CourseId);

        var newSection = ClassSection.Create(
            request.CourseId,
            request.SectionCode,
            semester
        );

        await classSectionRepository.AddAsync(newSection, cancellationToken);
        await classSectionRepository.SaveChangesAsync(cancellationToken);

        return new CreateClassSectionResponse(newSection.Id);
    }
}