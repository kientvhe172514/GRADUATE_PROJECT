using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Services;

public class AttendanceCalculationService(
    ILogger<AttendanceCalculationService> logger,
    IScheduleWhitelistRepository scheduleWhitelistRepository,
    IScanLogRepository scanLogRepository,
    ISessionRepository sessionRepository,
    IMediator mediator) : IAttendanceCalculationService
{
    public async Task<AttendanceCalculationResultDto> CalculateAttendanceForRound(
        Guid sessionId,
        Guid roundId,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting attendance calculation for Round {RoundId}", roundId);

        var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
        if (session is null) throw new NotFoundException(nameof(AttendanceCalculationService), sessionId);

        var lecturerId = session.LecturerId.ToString();

        // 1. Get whitelist (bây giờ lấy từ Schedule)
        var whitelist = await GetScheduleWhitelist(session.ScheduleId, cancellationToken);
        if (whitelist.Count == 0)
        {
            logger.LogWarning("No whitelist found for Session {SessionId}. Calculation cannot proceed.", sessionId);
            return new AttendanceCalculationResultDto
            {
                AttendedDeviceIds = [],
                LecturerId = lecturerId
            };
        }

        // 2. Get scan logs for round
        var scanLogs = await GetRoundScanLogs(roundId, cancellationToken);

        // 3. Apply BFS multi-hop algorithm
        var attendedDeviceIds = await CalculateAttendance(whitelist, scanLogs, cancellationToken);

        logger.LogInformation(
            "Successfully calculated attendance for Round {RoundId}: {Count} devices attended",
            roundId, attendedDeviceIds.Count);

        return new AttendanceCalculationResultDto
        {
            AttendedDeviceIds = attendedDeviceIds,
            LecturerId = lecturerId
        };
    }

    private async Task<HashSet<string>> GetScheduleWhitelist(Guid scheduleId, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Attempting to retrieve whitelist for Schedule {ScheduleId} from repository.",
            scheduleId);
        try
        {
            var whitelist = await scheduleWhitelistRepository.GetByScheduleIdAsync(scheduleId, cancellationToken);

            if (whitelist != null && whitelist.WhitelistedDeviceIds.Count != 0)
                return [..whitelist.WhitelistedDeviceIds.Select(id => id.ToString())];

            logger.LogWarning("No whitelist found or whitelist is empty for Schedule {ScheduleId}.", scheduleId);
            return [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching whitelist for Schedule {ScheduleId}.", scheduleId);
            throw;
        }
    }

    private async Task<List<ScanLog>> GetRoundScanLogs(Guid roundId, CancellationToken cancellationToken)
    {
        logger.LogInformation("Querying scan logs for Round {RoundId} using IScanLogRepository.", roundId);

        try
        {
            var scanLogs = await scanLogRepository.GetScanLogsByRoundIdAsync(roundId, cancellationToken);

            if (scanLogs.Count == 0)
            {
                logger.LogWarning("No scan logs found for Round {RoundId}.", roundId);
                return [];
            }

            logger.LogInformation("Found {Count} scan logs for Round {RoundId}.", scanLogs.Count, roundId);
            return scanLogs;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching scan logs for Round {RoundId}.", roundId);
            throw;
        }
    }

    private async Task<List<string>> CalculateAttendance(HashSet<string> whitelist,
        List<ScanLog> scanLogs, CancellationToken cancellationToken)
    {
        logger.LogInformation("Applying BFS multi-hop attendance algorithm with whitelist of {Count} devices",
            whitelist.Count);

        // 1. Filter submissions from registered devices only
        var filteredScanLogs = FilterWhitelistSubmissions(scanLogs, whitelist);

        // 2. Build neighbor records for each device
        var deviceRecords = await BuildDeviceRecords(filteredScanLogs, whitelist, cancellationToken);

        // 3. Find lecturer as BFS root
        var lecturerDeviceId = await FindLecturerRoot(deviceRecords, cancellationToken);

        // 4. Apply BFS algorithm
        var attendedDevices = ApplyBfsAlgorithm(deviceRecords, lecturerDeviceId, whitelist);

        // 5. Apply fill-in phase
        var finalAttendance = ApplyFillInPhase(deviceRecords, attendedDevices, whitelist);

        return finalAttendance.OrderBy(x => x).ToList();
    }

    private List<ScanLog> FilterWhitelistSubmissions(List<ScanLog> scanLogs, HashSet<string> whitelist)
    {
        var filtered = scanLogs
            .Where(s => whitelist.Contains(s.DeviceId.ToString()))
            .ToList();

        logger.LogInformation("Filtered {Original} submissions to {Filtered} from whitelisted devices",
            scanLogs.Count, filtered.Count);

        return filtered;
    }

    private async Task<List<DeviceRecordDto>> BuildDeviceRecords(List<ScanLog> scanLogs, HashSet<string> whitelist,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Building device records with neighbor scan lists");

        var groupedScanLogs = scanLogs
            .GroupBy(s => s.DeviceId.ToString())
            .ToList();

        var records = new List<DeviceRecordDto>();

        var allUniqueDeviceIdStrings = groupedScanLogs.Select(g => g.Key).ToList();
        var allUniqueDeviceIdGuids = allUniqueDeviceIdStrings.Select(Guid.Parse).ToList();

        var deviceRolesMap = new Dictionary<Guid, string>();
        if (allUniqueDeviceIdGuids.Count != 0)
        {
            var getDeviceRolesQuery = new GetUserRolesByDevicesIntegrationQuery(allUniqueDeviceIdGuids);
            var response = await mediator.Send(getDeviceRolesQuery, cancellationToken);
            deviceRolesMap = response.DeviceRolesMap;
            logger.LogInformation("Fetched roles for {Count} devices in batch query.", deviceRolesMap.Count);
        }

        foreach (var g in groupedScanLogs)
        {
            var deviceIdString = g.Key;
            var deviceIdGuid = Guid.Parse(deviceIdString);

            logger.LogDebug("Processing device {DeviceId} for role and scan list", deviceIdString);

            var role = deviceRolesMap.GetValueOrDefault(deviceIdGuid, "Unknown");
            if (role == "Unknown")
                logger.LogWarning(
                    "Role not found for Device {DeviceId} in batch result or initial error. Defaulting to 'Unknown'.",
                    deviceIdString);

            var scanList = g
                .SelectMany(s => s.ScannedDevices)
                .Where(d => whitelist.Contains(d.DeviceId))
                .GroupBy(d => d.DeviceId)
                .Select(gr => new { Id = gr.Key, Rssi = gr.Max(x => x.Rssi) })
                .OrderByDescending(x => x.Rssi)
                .Select(x => x.Id)
                .ToList();

            logger.LogDebug("Device {DeviceId} ({Role}) has {NeighborCount} neighbors after filtering",
                deviceIdString, role, scanList.Count);

            records.Add(new DeviceRecordDto
            {
                DeviceId = deviceIdString,
                Role = role,
                ScanList = scanList
            });
        }

        logger.LogInformation("Successfully built {RecordCount} device records", records.Count);
        return records;
    }

    private async Task<string> FindLecturerRoot(List<DeviceRecordDto> deviceRecords,
        CancellationToken cancellationToken)
    {
        try
        {
            var lecturerRecord = deviceRecords.FirstOrDefault(r =>
                r.Role.Equals(Role.Lecturer.ToString(), StringComparison.OrdinalIgnoreCase));

            if (lecturerRecord != null)
            {
                logger.LogInformation("Found lecturer {LecturerId} as BFS root", lecturerRecord.DeviceId);
                return lecturerRecord.DeviceId;
            }

            logger.LogWarning("No lecturer found in device records. Searching for alternative root...");

            var allScannedDeviceIds = deviceRecords
                .SelectMany(dr => dr.ScanList)
                .Distinct()
                .Select(Guid.Parse)
                .ToList();

            if (allScannedDeviceIds.Count == 0)
                throw new InvalidOperationException(
                    "No lecturer found and no scan data available for alternative root selection");

            var getDeviceRolesQuery = new GetUserRolesByDevicesIntegrationQuery(allScannedDeviceIds);
            var response = await mediator.Send(getDeviceRolesQuery, cancellationToken);
            var deviceRolesMap = response.DeviceRolesMap;

            logger.LogInformation("Fetched roles for {Count} devices from scan lists", deviceRolesMap.Count);

            var candidateDevices = new List<string>();

            foreach (var deviceRecord in deviceRecords)
            {
                if (deviceRecord.ScanList.Count == 0) continue;

                var hasLecturerInScanList = deviceRecord.ScanList
                    .Where(deviceIdString => Guid.TryParse(deviceIdString, out var deviceIdGuid) &&
                                             deviceRolesMap.ContainsKey(deviceIdGuid))
                    .Any(deviceIdString =>
                    {
                        var deviceIdGuid = Guid.Parse(deviceIdString);
                        var role = deviceRolesMap[deviceIdGuid];
                        return role.Equals(Role.Lecturer.ToString(), StringComparison.OrdinalIgnoreCase);
                    });

                if (!hasLecturerInScanList) continue;
                candidateDevices.Add(deviceRecord.DeviceId);
                logger.LogDebug("Device {DeviceId} can scan lecturer, added as candidate", deviceRecord.DeviceId);
            }

            if (candidateDevices.Count == 0)
                throw new InvalidOperationException("No lecturer found and no devices can scan lecturer for BFS root");

            var selectedRoot = candidateDevices.First();
            logger.LogInformation("Selected device {DeviceId} as alternative BFS root (can scan lecturer)",
                selectedRoot);

            return selectedRoot;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error finding lecturer root for BFS algorithm");
            throw;
        }
    }

    private HashSet<string> ApplyBfsAlgorithm(List<DeviceRecordDto> deviceRecords, string lecturerId,
        HashSet<string> whitelist)
    {
        logger.LogInformation("Starting BFS traversal from lecturer {LecturerId}", lecturerId);

        var scanMap = deviceRecords.ToDictionary(r => r.DeviceId, r => r.ScanList);
        var attendance = new HashSet<string> { lecturerId };
        var queue = new Queue<string>();
        queue.Enqueue(lecturerId);

        while (queue.Count != 0)
        {
            var currentDevice = queue.Dequeue();
            var neighbors = scanMap.GetValueOrDefault(currentDevice, new List<string>());

            foreach (var neighbor in neighbors)
                if (whitelist.Contains(neighbor) && attendance.Add(neighbor))
                    queue.Enqueue(neighbor);
        }

        logger.LogInformation("BFS phase completed: {Count} devices reached", attendance.Count);
        return attendance;
    }

    private HashSet<string> ApplyFillInPhase(List<DeviceRecordDto> deviceRecords, HashSet<string> attendance,
        HashSet<string> whitelist)
    {
        logger.LogInformation("Applying fill-in phase");

        var finalAttendance = new HashSet<string>(attendance);

        foreach (var deviceRecord in deviceRecords)
        {
            var deviceId = deviceRecord.DeviceId;
            var neighbors = deviceRecord.ScanList;

            if (finalAttendance.Contains(deviceId) ||
                !whitelist.Contains(deviceId) ||
                !neighbors.Any(n => finalAttendance.Contains(n))) continue;
            finalAttendance.Add(deviceId);
            logger.LogDebug("Fill-in: Added {DeviceId} (has attended neighbors)", deviceId);
        }

        logger.LogInformation("Fill-in phase completed: {Count} total devices attended", finalAttendance.Count);
        return finalAttendance;
    }
}