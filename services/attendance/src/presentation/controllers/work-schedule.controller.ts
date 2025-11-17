import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { CreateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/create-work-schedule.use-case';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  AssignWorkScheduleDto,
  WorkScheduleQueryDto,
} from '../dtos/work-schedule.dto';

@ApiTags('Work Schedules')
@Controller('work-schedules')
export class WorkScheduleController {
  constructor(
    private readonly createWorkScheduleUseCase: CreateWorkScheduleUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new work schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  async createSchedule(
    @Body() dto: CreateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createWorkScheduleUseCase.execute({
      ...dto,
      created_by: user.employee_id!,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all work schedules' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  async getSchedules(@Query() query: WorkScheduleQueryDto) {
    // TODO: Implement GetWorkSchedulesUseCase
    return {
      success: true,
      message: 'Schedules retrieved successfully',
      data: [],
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get work schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getScheduleById(@Param('id', ParseIntPipe) id: number) {
    // TODO: Implement GetWorkScheduleByIdUseCase
    return {
      success: true,
      message: 'Schedule retrieved successfully',
      data: null,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  async updateSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement UpdateWorkScheduleUseCase
    return {
      success: true,
      message: 'Schedule updated successfully',
      data: null,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  async deleteSchedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement DeleteWorkScheduleUseCase
    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign schedule to employees' })
  @ApiResponse({ status: 200, description: 'Schedule assigned successfully' })
  async assignSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement AssignWorkScheduleUseCase
    return {
      success: true,
      message: 'Schedule assigned successfully',
      data: null,
    };
  }

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get schedules for specific employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee schedules retrieved successfully',
  })
  async getEmployeeSchedules(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    // TODO: Implement GetEmployeeSchedulesUseCase
    return {
      success: true,
      message: 'Employee schedules retrieved successfully',
      data: [],
    };
  }
}
