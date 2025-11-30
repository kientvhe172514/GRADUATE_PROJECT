import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  Permissions,
  ApiResponseDto,
  Public,
} from '@graduate-project/shared-common';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { AttendanceCheckRecordQueryDto } from '../dtos/attendance-check-record.dto';

@ApiTags('Attendance Check Records')
@ApiBearerAuth()
@Public()
@Controller('attendance-check-records')
export class AttendanceCheckRecordController {
  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get attendance check records with filters (Admin/Manager/Employee)',
    description:
      'Returns detailed attendance check records including face verification, GPS validation, beacon data, etc. ' +
      'Admins/Managers can view all records. Employees can only view their own records.',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAttendanceCheckRecords(
    @Query() query: AttendanceCheckRecordQueryDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<
    ApiResponseDto<{ data: any[]; total: number; page: number; limit: number }>
  > {
    // If user is employee, force filter by their employee_id
    const effectiveEmployeeId =
      user?.role === 'EMPLOYEE' ? user.employee_id : query.employee_id;

    // Build where clause
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (effectiveEmployeeId) {
      whereClauses.push(`employee_id = $${paramIndex++}`);
      params.push(effectiveEmployeeId);
    }

    if (query.shift_id) {
      whereClauses.push(`shift_id = $${paramIndex++}`);
      params.push(query.shift_id);
    }

    if (query.is_valid !== undefined) {
      whereClauses.push(`is_valid = $${paramIndex++}`);
      params.push(query.is_valid);
    }

    if (query.face_verified !== undefined) {
      whereClauses.push(`face_verified = $${paramIndex++}`);
      params.push(query.face_verified);
    }

    if (query.gps_validated !== undefined) {
      whereClauses.push(`gps_validated = $${paramIndex++}`);
      params.push(query.gps_validated);
    }

    if (query.check_type) {
      whereClauses.push(`check_type = $${paramIndex++}`);
      params.push(query.check_type);
    }

    if (query.from_date && query.to_date) {
      whereClauses.push(
        `check_timestamp BETWEEN $${paramIndex++}::date AND $${paramIndex++}::date + INTERVAL '1 day'`,
      );
      params.push(query.from_date, query.to_date);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_check_records
      ${whereClause}
    `;
    const countResult = await this.attendanceCheckRepository[
      'repository'
    ].manager.query(countQuery, params);
    const total = parseInt(countResult[0]?.total || '0', 10);

    // Get paginated data
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT 
        id,
        employee_id,
        employee_code,
        department_id,
        shift_id,
        check_timestamp,
        check_type,
        beacon_id,
        beacon_validated,
        beacon_rssi,
        beacon_distance_meters,
        latitude,
        longitude,
        location_accuracy,
        gps_validated,
        distance_from_office_meters,
        device_id,
        ip_address,
        face_verified,
        face_confidence,
        verified_at,
        is_valid,
        validation_errors,
        is_manually_corrected,
        correction_reason,
        corrected_by,
        corrected_at,
        notes,
        created_at
      FROM attendance_check_records
      ${whereClause}
      ORDER BY check_timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const records = await this.attendanceCheckRepository[
      'repository'
    ].manager.query(dataQuery, [...params, limit, offset]);

    return ApiResponseDto.success(
      {
        data: records,
        total,
        page,
        limit,
      },
      'Attendance check records retrieved successfully',
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get attendance check record by ID',
    description:
      'Returns detailed information of a specific attendance check record',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAttendanceCheckRecordById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<any>> {
    const record = await this.attendanceCheckRepository.findById(id);

    if (!record) {
      return ApiResponseDto.error(
        'Attendance check record not found',
        404,
        'RECORD_NOT_FOUND',
      );
    }

    return ApiResponseDto.success(
      record,
      'Attendance check record retrieved successfully',
    );
  }

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get attendance check records for a specific employee',
    description:
      'Returns all attendance check records for a specific employee with date range filter',
  })
  @ApiQuery({ name: 'from_date', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to_date', required: false, example: '2025-01-31' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAttendanceCheckRecordsByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const startDate = fromDate
      ? new Date(fromDate)
      : new Date(new Date().setDate(new Date().getDate() - 30)); // Default: last 30 days
    const endDate = toDate ? new Date(toDate) : new Date();

    const records =
      await this.attendanceCheckRepository.findByEmployeeAndDateRange(
        employeeId,
        startDate,
        endDate,
      );

    // Apply pagination
    const paginatedRecords = records.slice(offset, offset + limit);

    return ApiResponseDto.success(
      {
        data: paginatedRecords,
        total: records.length,
      },
      'Employee attendance check records retrieved successfully',
    );
  }

  @Get('shift/:shiftId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all attendance check records for a specific shift',
    description:
      'Returns all check-in/check-out attempts for a shift (useful for debugging multiple scans)',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAttendanceCheckRecordsByShift(
    @Param('shiftId', ParseIntPipe) shiftId: number,
  ): Promise<ApiResponseDto<any[]>> {
    const records = await this.attendanceCheckRepository.findByShiftId(shiftId);

    return ApiResponseDto.success(
      records,
      `Attendance check records for shift ${shiftId} retrieved successfully`,
    );
  }
}
