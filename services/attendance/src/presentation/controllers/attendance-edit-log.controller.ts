import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { AttendanceEditLogRepository } from '../../infrastructure/repositories/attendance-edit-log.repository';
import { EditLogQueryDto } from '../dtos/edit-log.dto';

@ApiTags('Attendance Edit Logs')
@Controller('attendance-edit-logs')
export class AttendanceEditLogController {
  constructor(
    private readonly editLogRepository: AttendanceEditLogRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all edit logs (HR/Admin)' })
  @ApiResponse({ status: 200, description: 'Edit logs retrieved successfully' })
  async getAllLogs(@Query() query: EditLogQueryDto) {
    let logs;

    if (query.start_date && query.end_date) {
      logs = await this.editLogRepository.findByDateRange(
        new Date(query.start_date),
        new Date(query.end_date),
        query.limit ?? 100,
        query.offset ?? 0,
      );
    } else {
      logs = await this.editLogRepository.find({
        take: query.limit ?? 100,
        skip: query.offset ?? 0,
        order: { edited_at: 'DESC' },
      });
    }

    return {
      success: true,
      message: 'Edit logs retrieved successfully',
      data: logs,
      pagination: {
        limit: query.limit ?? 100,
        offset: query.offset ?? 0,
        total: logs.length,
      },
    };
  }

  @Get('shift/:shiftId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get edit history for a shift (HR/Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Shift edit history retrieved successfully',
  })
  async getShiftEditHistory(@Param('shiftId', ParseIntPipe) shiftId: number) {
    const logs = await this.editLogRepository.findByShiftId(shiftId);

    return {
      success: true,
      message: 'Shift edit history retrieved successfully',
      data: logs,
    };
  }

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get edit history for employee (HR/Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Employee edit history retrieved successfully',
  })
  async getEmployeeEditHistory(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const logs = await this.editLogRepository.findByEmployeeId(
      employeeId,
      limit,
      offset,
    );

    const total = await this.editLogRepository.countByEmployee(employeeId);

    return {
      success: true,
      message: 'Employee edit history retrieved successfully',
      data: logs,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  @Get('editor/:editorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get logs by editor (HR/Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Editor logs retrieved successfully',
  })
  async getLogsByEditor(
    @Param('editorId', ParseIntPipe) editorId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const logs = await this.editLogRepository.findByEditedBy(
      editorId,
      limit,
      offset,
    );

    const total = await this.editLogRepository.countByEditor(editorId);

    return {
      success: true,
      message: 'Editor logs retrieved successfully',
      data: logs,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  @Get('recent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recent edits (HR/Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Recent edits retrieved successfully',
  })
  async getRecentEdits(
    @Query('hours', new ParseIntPipe({ optional: true })) hours = 24,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
  ) {
    const logs = await this.editLogRepository.getRecentEdits(hours, limit);

    return {
      success: true,
      message: 'Recent edits retrieved successfully',
      data: logs,
    };
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get edit statistics (HR/Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Edit statistics retrieved successfully',
  })
  async getEditStatistics(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const statistics = await this.editLogRepository.getEditStatistics(
      new Date(startDate),
      new Date(endDate),
    );

    return {
      success: true,
      message: 'Edit statistics retrieved successfully',
      data: statistics,
    };
  }
}
