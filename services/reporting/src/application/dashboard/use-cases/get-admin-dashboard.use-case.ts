import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AdminDashboardQueryDto,
  AdminDashboardResponseDto,
  AdminKPICardDto,
  UserRoleDistributionDto,
  DepartmentEmployeeCountDto,
  LoginTrendDto,
  DeviceStatusDto,
  SystemActivityDto,
  FaceIDRegistrationStatsDto,
  AuthenticationFailureStatsDto,
  AdminDashboardPeriod,
} from '../dto/admin-dashboard.dto';

@Injectable()
export class GetAdminDashboardUseCase {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceClient: ClientProxy,
  ) {}

  async execute(query: AdminDashboardQueryDto): Promise<AdminDashboardResponseDto> {
    const { start_date, end_date, label } = this.calculatePeriodDates(
      query.period || AdminDashboardPeriod.MONTH,
      query.start_date,
      query.end_date,
    );

    // Fetch all admin dashboard data in parallel
    const [
      kpiCards,
      roleDistribution,
      departmentEmployeeCount,
      loginTrend,
      faceidStats,
      authFailureStats,
      devices,
      systemActivities,
    ] = await Promise.all([
      this.getAdminKPICards(start_date, end_date),
      this.getUserRoleDistribution(),
      this.getDepartmentEmployeeCount(),
      this.getLoginTrend(start_date, end_date),
      this.getFaceIDStats(),
      this.getAuthFailureStats(start_date, end_date),
      this.getDeviceStatus(),
      this.getSystemActivities(start_date, end_date),
    ]);

    return {
      period: {
        type: query.period || AdminDashboardPeriod.MONTH,
        start_date,
        end_date,
        label,
      },
      kpi_cards: kpiCards,
      charts: {
        role_distribution: roleDistribution,
        department_employee_count: departmentEmployeeCount,
        login_trend: loginTrend,
      },
      faceid_stats: faceidStats,
      auth_failure_stats: authFailureStats,
      devices,
      system_activities: systemActivities,
    };
  }

  private calculatePeriodDates(
    period: AdminDashboardPeriod,
    customStart?: string,
    customEnd?: string,
  ): { start_date: string; end_date: string; label: string } {
    const now = new Date();
    let start_date: Date;
    let end_date: Date = new Date();
    let label: string;

    if (customStart && customEnd) {
      start_date = new Date(customStart);
      end_date = new Date(customEnd);
      label = `${customStart} to ${customEnd}`;
    } else if (period === AdminDashboardPeriod.DAY) {
      start_date = new Date(now);
      end_date = new Date(now);
      label = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (period === AdminDashboardPeriod.WEEK) {
      const dayOfWeek = now.getDay();
      start_date = new Date(now);
      start_date.setDate(now.getDate() - dayOfWeek);
      end_date = new Date(start_date);
      end_date.setDate(start_date.getDate() + 6);
      label = `Week of ${start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (period === AdminDashboardPeriod.MONTH) {
      start_date = new Date(now.getFullYear(), now.getMonth(), 1);
      end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      label = start_date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === AdminDashboardPeriod.QUARTER) {
      const quarter = Math.floor(now.getMonth() / 3);
      start_date = new Date(now.getFullYear(), quarter * 3, 1);
      end_date = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      label = `Q${quarter + 1} ${now.getFullYear()}`;
    } else {
      // YEAR
      start_date = new Date(now.getFullYear(), 0, 1);
      end_date = new Date(now.getFullYear(), 11, 31);
      label = now.getFullYear().toString();
    }

    return {
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0],
      label,
    };
  }

  private async getAdminKPICards(startDate: string, endDate: string): Promise<AdminKPICardDto[]> {
    // Mock data - replace with actual queries to Auth/Employee services
    const totalUsersQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status != 'active') as inactive_users,
        COUNT(*) as total_users
      FROM employee_cache
    `;

    const departmentQuery = `
      SELECT COUNT(DISTINCT department_id) as total_departments
      FROM employee_cache
      WHERE department_id IS NOT NULL
    `;

    const faceIdQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE face_id_registered = true) as registered,
        COUNT(*) FILTER (WHERE face_id_registered = false OR face_id_registered IS NULL) as not_registered,
        COUNT(*) as total
      FROM employee_cache
    `;

    const newAccountsQuery = `
      SELECT COUNT(*) as new_accounts
      FROM employee_cache
      WHERE created_at BETWEEN $1 AND $2
    `;

    const [usersResult, departmentResult, faceIdResult, newAccountsResult] = await Promise.all([
      this.dataSource.query(totalUsersQuery),
      this.dataSource.query(departmentQuery),
      this.dataSource.query(faceIdQuery),
      this.dataSource.query(newAccountsQuery, [startDate, endDate]),
    ]);

    const users = usersResult[0] || { total_users: 0, active_users: 0, inactive_users: 0 };
    const departments = departmentResult[0] || { total_departments: 0 };
    const faceId = faceIdResult[0] || { registered: 0, not_registered: 0, total: 0 };
    const newAccounts = newAccountsResult[0] || { new_accounts: 0 };

    return [
      {
        title: 'Total Users',
        value: parseInt(users.total_users, 10),
        unit: 'users',
        icon: '👥',
        trend: undefined,
        trend_direction: 'stable',
        color: 'info',
        details: `${users.active_users} active / ${users.inactive_users} inactive`,
      },
      {
        title: 'Total Departments',
        value: parseInt(departments.total_departments, 10),
        unit: 'departments',
        icon: '🏢',
        trend: undefined,
        trend_direction: 'stable',
        color: 'info',
      },
      {
        title: 'FaceID Registered',
        value: parseInt(faceId.registered, 10),
        unit: 'employees',
        icon: '👤',
        trend: Math.round((parseInt(faceId.registered, 10) / parseInt(faceId.total, 10)) * 100),
        trend_direction: 'up',
        color: 'success',
        details: `${faceId.not_registered} not registered`,
      },
      {
        title: 'Device Status',
        value: 0, // Will be calculated from device list
        unit: 'online',
        icon: '📱',
        trend: undefined,
        trend_direction: 'stable',
        color: 'warning',
      },
      {
        title: 'New Accounts (Month)',
        value: parseInt(newAccounts.new_accounts, 10),
        unit: 'accounts',
        icon: '✨',
        trend: undefined,
        trend_direction: 'up',
        color: 'success',
      },
      {
        title: 'Auth Failures',
        value: 0, // Will be calculated from auth failure stats
        unit: 'failures',
        icon: '⚠️',
        trend: undefined,
        trend_direction: 'down',
        color: 'danger',
      },
    ];
  }

  private async getUserRoleDistribution(): Promise<UserRoleDistributionDto[]> {
    const query = `
      SELECT 
        role_name as role,
        COUNT(*) as count
      FROM employee_cache
      WHERE role_name IS NOT NULL
      GROUP BY role_name
      ORDER BY count DESC
    `;

    const result = await this.dataSource.query(query);
    const total = result.reduce((sum: number, row: any) => sum + parseInt(row.count, 10), 0);

    const colorMap: { [key: string]: string } = {
      'ADMIN': '#ef4444',
      'HR_MANAGER': '#f59e0b',
      'DEPARTMENT_MANAGER': '#3b82f6',
      'EMPLOYEE': '#10b981',
    };

    return result.map((row: any) => ({
      role: row.role,
      count: parseInt(row.count, 10),
      percentage: Math.round((parseInt(row.count, 10) / total) * 100),
      color: colorMap[row.role] || '#6b7280',
    }));
  }

  private async getDepartmentEmployeeCount(): Promise<DepartmentEmployeeCountDto[]> {
    const query = `
      SELECT 
        department_id,
        department_name,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status != 'active') as inactive_count
      FROM employee_cache
      WHERE department_id IS NOT NULL
      GROUP BY department_id, department_name
      ORDER BY count DESC
    `;

    const result = await this.dataSource.query(query);

    return result.map((row: any) => ({
      department_id: row.department_id,
      department_name: row.department_name || `Department ${row.department_id}`,
      count: parseInt(row.count, 10),
      active_count: parseInt(row.active_count, 10),
      inactive_count: parseInt(row.inactive_count, 10),
    }));
  }

  private async getLoginTrend(startDate: string, endDate: string): Promise<LoginTrendDto[]> {
    // Mock data - should query actual login logs from Auth service
    const query = `
      SELECT 
        es.shift_date as date,
        COUNT(DISTINCT es.employee_id) as unique_users,
        COUNT(DISTINCT es.employee_id) as login_count,
        0 as failed_attempts
      FROM employee_shifts es
      WHERE es.shift_date BETWEEN $1 AND $2
      GROUP BY es.shift_date
      ORDER BY es.shift_date ASC
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);

    return result.map((row: any) => ({
      date: row.date,
      login_count: parseInt(row.login_count, 10),
      unique_users: parseInt(row.unique_users, 10),
      failed_attempts: parseInt(row.failed_attempts, 10),
    }));
  }

  private async getFaceIDStats(): Promise<FaceIDRegistrationStatsDto> {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE face_id_registered = true) as registered,
        COUNT(*) FILTER (WHERE face_id_registered = false OR face_id_registered IS NULL) as not_registered,
        COUNT(*) FILTER (WHERE face_id_pending_verification = true) as pending_verification
      FROM employee_cache
    `;

    const result = await this.dataSource.query(query);
    const data = result[0] || { total_employees: 0, registered: 0, not_registered: 0, pending_verification: 0 };

    const total = parseInt(data.total_employees, 10);
    const registered = parseInt(data.registered, 10);

    return {
      total_employees: total,
      registered,
      not_registered: parseInt(data.not_registered, 10),
      registration_rate: total > 0 ? Math.round((registered / total) * 100) : 0,
      pending_verification: parseInt(data.pending_verification, 10),
    };
  }

  private async getAuthFailureStats(startDate: string, endDate: string): Promise<AuthenticationFailureStatsDto> {
    // Mock data - should query actual authentication logs
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE check_in_time IS NULL AND status = 'SCHEDULED') as total_failures,
        0 as faceid_failures,
        0 as gps_failures,
        0 as other_failures
      FROM employee_shifts
      WHERE shift_date BETWEEN $1 AND $2
    `;

    const result = await this.dataSource.query(query, [startDate, endDate]);
    const data = result[0] || { total_failures: 0, faceid_failures: 0, gps_failures: 0, other_failures: 0 };

    const totalAttempts = 1000; // Mock value
    const totalFailures = parseInt(data.total_failures, 10);

    return {
      total_attempts: totalAttempts,
      faceid_failures: parseInt(data.faceid_failures, 10),
      gps_failures: parseInt(data.gps_failures, 10),
      other_failures: parseInt(data.other_failures, 10),
      failure_rate: totalAttempts > 0 ? Math.round((totalFailures / totalAttempts) * 100) : 0,
      top_reasons: [
        { reason: 'Face not recognized', count: 45 },
        { reason: 'GPS out of range', count: 32 },
        { reason: 'Network timeout', count: 18 },
      ],
    };
  }

  private async getDeviceStatus(): Promise<DeviceStatusDto[]> {
    // Mock data - should query actual device management system
    try {
      const devices = await firstValueFrom(
        this.attendanceClient.send('devices.list', {}),
      );
      
      if (devices?.data) {
        return devices.data.map((device: any) => ({
          device_id: device.id || device.device_id,
          device_name: device.name || device.device_name,
          device_type: device.type || 'Beacon',
          status: device.status || 'offline',
          location: device.location || 'Unknown',
          last_seen: device.last_seen || null,
          battery_level: device.battery_level || null,
          signal_strength: device.signal_strength || null,
        }));
      }
    } catch (error) {
      // Return mock data if service unavailable
    }

    return [
      {
        device_id: 'BEACON-001',
        device_name: 'Main Entrance Beacon',
        device_type: 'Beacon',
        status: 'online',
        location: 'Floor 1 - Main Entrance',
        last_seen: new Date().toISOString(),
        battery_level: 85,
        signal_strength: 92,
      },
      {
        device_id: 'BEACON-002',
        device_name: 'Office Floor 2',
        device_type: 'Beacon',
        status: 'online',
        location: 'Floor 2 - Office Area',
        last_seen: new Date().toISOString(),
        battery_level: 72,
        signal_strength: 88,
      },
      {
        device_id: 'CAM-001',
        device_name: 'Face Recognition Camera 1',
        device_type: 'Camera',
        status: 'offline',
        location: 'Floor 1 - Reception',
        last_seen: new Date(Date.now() - 3600000).toISOString(),
        battery_level: undefined,
        signal_strength: 0,
      },
    ];
  }

  private async getSystemActivities(startDate: string, endDate: string): Promise<SystemActivityDto[]> {
    // Mock data - should query actual system activity logs
    return [
      {
        timestamp: new Date().toISOString(),
        type: 'USER_LOGIN',
        description: 'Admin user logged in',
        user_id: 1,
        user_name: 'John Admin',
        severity: 'info',
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'PERMISSION_CHANGE',
        description: 'User role updated from EMPLOYEE to HR_MANAGER',
        user_id: 2,
        user_name: 'Jane Smith',
        severity: 'warning',
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'DEVICE_OFFLINE',
        description: 'Face Recognition Camera 1 went offline',
        user_id: undefined,
        user_name: undefined,
        severity: 'error',
      },
    ];
  }
}
