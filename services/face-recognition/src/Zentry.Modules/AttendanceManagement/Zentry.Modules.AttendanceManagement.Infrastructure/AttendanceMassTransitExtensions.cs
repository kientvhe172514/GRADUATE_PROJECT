using MassTransit;
using Zentry.Modules.AttendanceManagement.Application.EventHandlers;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.AttendanceManagement.Infrastructure;

public static class AttendanceMassTransitExtensions
{
    public static void AddAttendanceMassTransitConsumers(this IBusRegistrationConfigurator configurator)
    {
        configurator.AddConsumer<CreateRoundsConsumer>(typeof(CreateRoundsConsumerDefinition));
        configurator.AddConsumer<CreateSessionConsumer>(typeof(CreateSessionConsumerDefinition));
        configurator.AddConsumer<GenerateScheduleWhitelistConsumer>(
            typeof(GenerateScheduleWhitelistConsumerDefinition));
        configurator.AddConsumer<SubmitScanDataConsumer>(typeof(SubmitScanDataConsumerDefinition));
        configurator.AddConsumer<FinalAttendanceConsumer>(typeof(FinalAttendanceConsumerDefinition));
        configurator.AddConsumer<CalculateRoundAttendanceConsumer>(typeof(CalculateRoundAttendanceConsumerDefinition));
        configurator.AddConsumer<ProcessActiveRoundForEndSessionConsumer>(
            typeof(ProcessActiveRoundForEndSessionConsumerDefinition));
        configurator.AddConsumer<AssignLecturerConsumer>(typeof(AssignLecturerConsumerDefinition));
        configurator.AddConsumer<BatchedSessionFinalAttendanceConsumer>(
            typeof(BatchedSessionFinalAttendanceConsumerDefinition));
        configurator.AddConsumer<UpdateRoundsConsumer>(typeof(UpdateRoundsConsumerDefinition));
        configurator.AddConsumer<DeleteScheduleSessionsConsumer>(typeof(DeleteScheduleSessionsConsumerDefinition));
        configurator.AddConsumer<AttendanceRecordCreatorConsumer>(typeof(AttendanceRecordCreatorConsumerDefinition));
        configurator.AddConsumer<StudentEnrollmentWhitelistConsumer>(
            typeof(StudentEnrollmentWhitelistConsumerDefinition));
    }

    public static void ConfigureAttendanceReceiveEndpoints(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        // Main attendance processing queue với cải thiện
        cfg.ReceiveEndpoint("attendance_scan_data_queue", e =>
        {
            // Queue settings
            e.Durable = true; // Queue persistent
            e.AutoDelete = false;
            e.PrefetchCount = 10; // Giới hạn messages được fetch cùng lúc
            e.ConcurrentMessageLimit = 5; // Giới hạn messages xử lý đồng thời

            // Consumer configuration
            e.ConfigureConsumer<CreateRoundsConsumer>(context);
            e.ConfigureConsumer<CreateSessionConsumer>(context);
            e.ConfigureConsumer<GenerateScheduleWhitelistConsumer>(context);
            e.ConfigureConsumer<SubmitScanDataConsumer>(context);
            e.ConfigureConsumer<FinalAttendanceConsumer>(context);
            e.ConfigureConsumer<AssignLecturerConsumer>(context);
            e.ConfigureConsumer<BatchedSessionFinalAttendanceConsumer>(context);
            e.ConfigureConsumer<UpdateRoundsConsumer>(context);
            e.ConfigureConsumer<DeleteScheduleSessionsConsumer>(context);
            e.ConfigureConsumer<AttendanceRecordCreatorConsumer>(context);
            e.ConfigureConsumer<StudentEnrollmentWhitelistConsumer>(context);

            // Retry policy cải thiện
            e.UseMessageRetry(r =>
            {
                r.Exponential(5, TimeSpan.FromSeconds(2), TimeSpan.FromMinutes(2), TimeSpan.FromSeconds(2));
                r.Handle<Exception>(); // Retry tất cả exceptions
            });

            // Circuit breaker
            e.UseCircuitBreaker(cb =>
            {
                cb.TrackingPeriod = TimeSpan.FromMinutes(1);
                cb.TripThreshold = 5;
                cb.ActiveThreshold = 3;
                cb.ResetInterval = TimeSpan.FromMinutes(2);
            });

            // Rate limiter
            e.UseRateLimit(10, TimeSpan.FromSeconds(1));

            // Message TTL
            e.SetQueueArgument("x-message-ttl", 300000); // 5 phút
            e.SetQueueArgument("x-max-length", 1000); // Giới hạn queue size

            // Dead letter queue
            e.SetQueueArgument("x-dead-letter-exchange", "attendance_dlx");
            e.SetQueueArgument("x-dead-letter-routing-key", "attendance_failed");
        });

        // Calculation queue với cải thiện
        cfg.ReceiveEndpoint("attendance_calculation_queue", e =>
        {
            e.Durable = true;
            e.AutoDelete = false;
            e.PrefetchCount = 5; // Ít hơn vì calculation nặng hơn
            e.ConcurrentMessageLimit = 3;

            e.ConfigureConsumer<CalculateRoundAttendanceConsumer>(context);

            e.UseMessageRetry(r =>
            {
                r.Exponential(8, TimeSpan.FromSeconds(5), TimeSpan.FromMinutes(5), TimeSpan.FromSeconds(3));
                r.Handle<InvalidOperationException>();
                r.Handle<ArgumentException>();
                r.Handle<DivideByZeroException>();
                r.Handle<TimeoutException>();
            });

            e.UseCircuitBreaker(cb =>
            {
                cb.TrackingPeriod = TimeSpan.FromMinutes(2);
                cb.TripThreshold = 10;
                cb.ActiveThreshold = 5;
                cb.ResetInterval = TimeSpan.FromMinutes(3);
            });

            e.UseRateLimit(5, TimeSpan.FromSeconds(1));

            // Longer TTL for calculation tasks
            e.SetQueueArgument("x-message-ttl", 600000); // 10 phút
            e.SetQueueArgument("x-max-length", 500);
            e.SetQueueArgument("x-dead-letter-exchange", "attendance_calculation_dlx");
            e.SetQueueArgument("x-dead-letter-routing-key", "calculation_failed");
        });

        // End session queue với cải thiện
        cfg.ReceiveEndpoint("end_session_processing_queue", e =>
        {
            e.Durable = true;
            e.AutoDelete = false;
            e.PrefetchCount = 5;
            e.ConcurrentMessageLimit = 2; // Ít hơn vì là critical operation

            e.ConfigureConsumer<ProcessActiveRoundForEndSessionConsumer>(context);

            e.UseMessageRetry(r =>
            {
                r.Exponential(12, TimeSpan.FromSeconds(10), TimeSpan.FromMinutes(10), TimeSpan.FromSeconds(5));
                r.Handle<InvalidOperationException>();
                r.Handle<ArgumentException>();
                r.Handle<DivideByZeroException>();
                r.Handle<TimeoutException>();
            });

            e.UseCircuitBreaker(cb =>
            {
                cb.TrackingPeriod = TimeSpan.FromMinutes(2);
                cb.TripThreshold = 8;
                cb.ActiveThreshold = 3;
                cb.ResetInterval = TimeSpan.FromMinutes(5);
            });

            e.UseRateLimit(3, TimeSpan.FromSeconds(1));

            e.SetQueueArgument("x-message-ttl", 900000); // 15 phút cho end session
            e.SetQueueArgument("x-max-length", 200);
            e.SetQueueArgument("x-dead-letter-exchange", "end_session_dlx");
            e.SetQueueArgument("x-dead-letter-routing-key", "end_session_failed");
        });

        // Dead letter exchanges
        cfg.Send<DeadLetterMessage>(x => x.UseRoutingKeyFormatter(_ => "attendance_failed"));
        cfg.Publish<DeadLetterMessage>(x => x.Durable = true);
    }
}

// Consumer Definitions để control consumer behavior
public class CreateRoundsConsumerDefinition : ConsumerDefinition<CreateRoundsConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<CreateRoundsConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class CreateSessionConsumerDefinition : ConsumerDefinition<CreateSessionConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<CreateSessionConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class GenerateScheduleWhitelistConsumerDefinition : ConsumerDefinition<GenerateScheduleWhitelistConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<GenerateScheduleWhitelistConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class SubmitScanDataConsumerDefinition : ConsumerDefinition<SubmitScanDataConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<SubmitScanDataConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(5, TimeSpan.FromSeconds(3)));
    }
}

public class FinalAttendanceConsumerDefinition : ConsumerDefinition<FinalAttendanceConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<FinalAttendanceConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(5, TimeSpan.FromSeconds(3)));
    }
}

public class CalculateRoundAttendanceConsumerDefinition : ConsumerDefinition<CalculateRoundAttendanceConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<CalculateRoundAttendanceConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r =>
            r.Exponential(8, TimeSpan.FromSeconds(5), TimeSpan.FromMinutes(5), TimeSpan.FromSeconds(3)));
    }
}

public class
    ProcessActiveRoundForEndSessionConsumerDefinition : ConsumerDefinition<ProcessActiveRoundForEndSessionConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<ProcessActiveRoundForEndSessionConsumer> consumerConfigurator,
        IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r =>
            r.Exponential(12, TimeSpan.FromSeconds(10), TimeSpan.FromMinutes(10), TimeSpan.FromSeconds(5)));
    }
}

public class AssignLecturerConsumerDefinition : ConsumerDefinition<AssignLecturerConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<AssignLecturerConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class BatchedSessionFinalAttendanceConsumerDefinition : ConsumerDefinition<BatchedSessionFinalAttendanceConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<BatchedSessionFinalAttendanceConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(5, TimeSpan.FromSeconds(3)));
    }
}

public class UpdateRoundsConsumerDefinition : ConsumerDefinition<UpdateRoundsConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<UpdateRoundsConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class DeleteScheduleSessionsConsumerDefinition : ConsumerDefinition<DeleteScheduleSessionsConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<DeleteScheduleSessionsConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class AttendanceRecordCreatorConsumerDefinition : ConsumerDefinition<AttendanceRecordCreatorConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<AttendanceRecordCreatorConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}

public class StudentEnrollmentWhitelistConsumerDefinition : ConsumerDefinition<StudentEnrollmentWhitelistConsumer>
{
    protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
        IConsumerConfigurator<StudentEnrollmentWhitelistConsumer> consumerConfigurator, IRegistrationContext context)
    {
        consumerConfigurator.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    }
}