import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponseDto, Permissions, CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import {
  HighlightReportQueryDto,
  HighlightReportResponseDto,
  HighlightReportDetailQueryDto,
  HighlightDetailResponseDto,
} from '../../application/dashboard/dto/highlight-report.dto';
import {
  HRDashboardQueryDto,
  HRDashboardResponseDto,
} from '../../application/dashboard/dto/hr-dashboard.dto';
import {
  AdminDashboardQueryDto,
  AdminDashboardResponseDto,
} from '../../application/dashboard/dto/admin-dashboard.dto';
import { GetHighlightReportUseCase } from '../../application/dashboard/use-cases/get-highlight-report.use-case';
import { GetHighlightDetailUseCase } from '../../application/dashboard/use-cases/get-highlight-detail.use-case';
import { GetHRDashboardUseCase } from '../../application/dashboard/use-cases/get-hr-dashboard.use-case';
import { GetAdminDashboardUseCase } from '../../application/dashboard/use-cases/get-admin-dashboard.use-case';

@ApiTags('Dashboards & Reports')
@ApiBearerAuth('bearer')
@Controller('reports/dashboard')
export class DashboardController {
  constructor(
    private readonly getHighlightReportUseCase: GetHighlightReportUseCase,
    private readonly getHighlightDetailUseCase: GetHighlightDetailUseCase,
    private readonly getHRDashboardUseCase: GetHRDashboardUseCase,
    private readonly getAdminDashboardUseCase: GetAdminDashboardUseCase,
  ) {}

  @Get('highlight')
  @HttpCode(HttpStatus.OK)
  @Permissions('report.read')
  @ApiOperation({
    summary: 'Get highlight report with KPI cards and top performers',
    description: `
      **Highlight Report Dashboard for HR/DM**
      
      Provides key performance indicators and highlights for attendance management.
      
      **Features:**
      - Filter by period: MONTH, QUARTER, YEAR
      - Filter by department (DM sees only their department)
      - KPI cards with trends:
        - 🔴 Top Most Late
        - 🟠 Top Most Early Leave
        - 🟡 Top Most Leave
        - 🟢 Top Most Overtime
      - ⚠️ List of employees with unusual absences
      - Overall statistics
      
      **Use Case:**
      - HR Manager: View company-wide or department-specific highlights
      - Department Manager: View their department's highlights
      - Click on any KPI card to drill down into detailed top 5 lists
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Highlight report retrieved successfully',
    type: HighlightReportResponseDto,
  })
  async getHighlightReport(
    @Query() query: HighlightReportQueryDto,
  ): Promise<ApiResponseDto<HighlightReportResponseDto>> {
    const data = await this.getHighlightReportUseCase.execute(query);
    return ApiResponseDto.success(data, 'Highlight report retrieved successfully');
  }

  @Get('highlight/detail')
  @HttpCode(HttpStatus.OK)
  @Permissions('report.read')
  @ApiOperation({
    summary: 'Get detailed top N employees for specific highlight category',
    description: `
      **Drill-down view for highlight KPI cards**
      
      Click on any KPI card in the highlight report to see the top N employees for that category.
      
      **Categories:**
      - LATE: Top employees with most late arrivals
      - EARLY: Top employees with most early leaves
      - LEAVE: Top employees with most leave days
      - OVERTIME: Top employees with most overtime hours
      - UNUSUAL_ABSENCE: Employees with unusual absence patterns
      
      **Returns:**
      - Top N employees (default 5, configurable)
      - Summary statistics (total, average, highest, lowest)
      - Employee details with counts and metrics
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Highlight detail retrieved successfully',
    type: HighlightDetailResponseDto,
  })
  async getHighlightDetail(
    @Query() query: HighlightReportDetailQueryDto,
  ): Promise<ApiResponseDto<HighlightDetailResponseDto>> {
    const data = await this.getHighlightDetailUseCase.execute(query);
    return ApiResponseDto.success(data, 'Highlight detail retrieved successfully');
  }

  @Get('hr')
  @HttpCode(HttpStatus.OK)
  @Permissions('report.read')
  @ApiOperation({
    summary: 'Get HR/Department Manager Dashboard',
    description: `
      **Comprehensive attendance dashboard for HR and Department Managers**
      
      **Top Row - KPI Cards:**
      - Total Employees
      - Total Working Hours (by period)
      - Total Overtime
      - Total Leave Days
      - On-Time Rate (%)
      
      **Mid Row - Charts:**
      - 📊 Pie chart: Status distribution (On-time / Late / Leave / Absent)
      - 🥧 Pie chart: Leave rate by type (Annual / Sick / Unpaid / etc.)
      - 📈 Line chart: Average working hours trend (week/month, month/year)
      - 📊 Bar chart: Department comparison (late/leave) - HR only
      
      **Bottom Row:**
      - 🗓️ Heatmap calendar: Daily status color coding
      - 👥 Resource allocation by department
      
      **Permissions:**
      - HR Manager: See all departments or filter by specific department
      - Department Manager: See only their assigned department
      
      **Period Options:**
      - DAY, WEEK, MONTH, QUARTER, YEAR, CUSTOM
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'HR dashboard retrieved successfully',
    type: HRDashboardResponseDto,
  })
  async getHRDashboard(
    @Query() query: HRDashboardQueryDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ApiResponseDto<HRDashboardResponseDto>> {
    const data = await this.getHRDashboardUseCase.execute(query, currentUser);
    return ApiResponseDto.success(data, 'HR dashboard retrieved successfully');
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin.dashboard.read')
  @ApiOperation({
    summary: 'Get Admin Dashboard (System-wide)',
    description: `
      **System administration and monitoring dashboard**
      
      **Top Row - KPI Cards:**
      - 👥 Total users (active / inactive)
      - 🏢 Total departments
      - 👤 FaceID registered / not registered
      - 📱 Device status (online/offline count)
      - ✨ New accounts created in period
      - ⚠️ Failed authentications (FaceID / GPS mismatch)
      
      **Mid Row - Charts:**
      - 📊 Pie chart: User allocation by role (Admin / HR / DM / Employee)
      - 📊 Bar chart: Number of employees in each department
      - 📈 Line chart: Daily logins
      
      **Bottom Row:**
      - 📋 System activity log (recent actions, logins, permission changes)
      - 🔧 Device status list (beacons, cameras with battery, signal strength)
      
      **Features:**
      - Real-time device monitoring
      - User management overview
      - System security metrics
      - Activity audit trail
      
      **Access:**
      - ADMIN role only
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard retrieved successfully',
    type: AdminDashboardResponseDto,
  })
  async getAdminDashboard(
    @Query() query: AdminDashboardQueryDto,
  ): Promise<ApiResponseDto<AdminDashboardResponseDto>> {
    const data = await this.getAdminDashboardUseCase.execute(query);
    return ApiResponseDto.success(data, 'Admin dashboard retrieved successfully');
  }
}
