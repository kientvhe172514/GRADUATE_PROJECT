using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.Entities;

public class Room : AggregateRoot<Guid>
{
    private Room() : base(Guid.Empty)
    {
    }

    private Room(Guid id, string roomName, string building)
        : base(id)
    {
        RoomName = roomName;
        Building = building;
        CreatedAt = DateTime.UtcNow;
        IsDeleted = false;
    }

    [Required] [StringLength(100)] public string RoomName { get; private set; }

    [Required] [StringLength(100)] public string Building { get; private set; }


    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; private set; }


    public static Room Create(string roomName, string building)
    {
        return new Room(Guid.NewGuid(), roomName, building);
    }

    public void Update(string? roomName = null, string? building = null)
    {
        if (!string.IsNullOrWhiteSpace(roomName)) RoomName = roomName;
        if (!string.IsNullOrWhiteSpace(building)) Building = building;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }
}