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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  Permissions,
  ApiResponseDto,
  Public,
  BusinessException,
} from '@graduate-project/shared-common';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  AssignWorkScheduleDto,
  ListWorkScheduleDto,
  WorkScheduleDto,
  UpdateAssignmentDatesDto,
  EmployeeWorkScheduleDto,
} from '../../application/dtos/work-schedule.dto';
import {
  AddScheduleOverrideDto,
  ScheduleOverrideDto,
} from '../../application/dtos/schedule-override.dto';
import { AddScheduleOverrideUseCase } from '../../application/use-cases/work-schedule/add-schedule-override.use-case';
import { ListScheduleOverridesUseCase } from '../../application/use-cases/work-schedule/list-schedule-overrides.use-case';
import { RemoveScheduleOverrideUseCase } from '../../application/use-cases/work-schedule/remove-schedule-override.use-case';
import { CreateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/create-work-schedule.use-case';
import { UpdateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/update-work-schedule.use-case';
import { ListWorkSchedulesUseCase } from '../../application/use-cases/work-schedule/list-work-schedules.use-case';
import { GetWorkScheduleByIdUseCase } from '../../application/use-cases/work-schedule/get-work-schedule-by-id.use-case';
import { DeleteWorkScheduleUseCase } from '../../application/use-cases/work-schedule/delete-work-schedule.use-case';
import { AssignScheduleToEmployeesUseCase } from '../../application/use-cases/work-schedule/assign-schedule-to-employees.use-case';
import { RemoveScheduleAssignmentUseCase } from '../../application/use-cases/work-schedule/remove-schedule-assignment.use-case';
import { UpdateScheduleAssignmentUseCase } from '../../application/use-cases/work-schedule/update-schedule-assignment.use-case';
import { DeleteEmployeeShiftUseCase } from '../../application/use-cases/work-schedule/delete-employee-shift.use-case';
import { IEmployeeWorkScheduleRepository } from '../../application/ports/work-schedule.repository.port';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../application/tokens';
import { Inject } from '@nestjs/common';

@ApiTags('Work Schedules')
@ApiBearerAuth()
@Public()
@Controller('work-schedules')
export class WorkScheduleController {
  constructor(
    private readonly createWorkScheduleUseCase: CreateWorkScheduleUseCase,
    private readonly updateWorkScheduleUseCase: UpdateWorkScheduleUseCase,
    private readonly listWorkSchedulesUseCase: ListWorkSchedulesUseCase,
    private readonly getWorkScheduleByIdUseCase: GetWorkScheduleByIdUseCase,
    private readonly deleteWorkScheduleUseCase: DeleteWorkScheduleUseCase,
    private readonly assignScheduleToEmployeesUseCase: AssignScheduleToEmployeesUseCase,
    private readonly removeScheduleAssignmentUseCase: RemoveScheduleAssignmentUseCase,
    private readonly updateScheduleAssignmentUseCase: UpdateScheduleAssignmentUseCase,
    private readonly deleteEmployeeShiftUseCase: DeleteEmployeeShiftUseCase,
    private readonly addScheduleOverrideUseCase: AddScheduleOverrideUseCase,
    private readonly listScheduleOverridesUseCase: ListScheduleOverridesUseCase,
    private readonly removeScheduleOverrideUseCase: RemoveScheduleOverrideUseCase,
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new work schedule' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: ApiResponseDto,
  })
  async create(
    @Body() dto: CreateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.createWorkScheduleUseCase.execute(dto, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all work schedules with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved successfully',
    type: ApiResponseDto,
  })
  async findAll(
    @Query() dto: ListWorkScheduleDto,
  ): Promise<ApiResponseDto<{ data: WorkScheduleDto[]; total: number }>> {
    return this.listWorkSchedulesUseCase.execute(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get work schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved successfully',
    type: ApiResponseDto,
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.getWorkScheduleByIdUseCase.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update work schedule' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
    type: ApiResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.updateWorkScheduleUseCase.execute(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a work schedule' })
  @ApiResponse({
    status: 200,
    description: 'Schedule deactivated successfully',
    type: ApiResponseDto,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.deleteWorkScheduleUseCase.execute(id, user);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a work schedule to employees' })
  @ApiResponse({
    status: 200,
    description: 'Schedule assigned successfully',
    type: ApiResponseDto,
  })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.assignScheduleToEmployeesUseCase.execute(id, dto, user);
  }

  @Get('assignments/employee/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all schedule assignments for an employee',
    description:
      'Returns all work schedule assignments (past and current) for a specific employee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
    type: ApiResponseDto,
  })
  async getEmployeeAssignments(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ): Promise<ApiResponseDto<EmployeeWorkScheduleDto[]>> {
    const assignments =
      await this.employeeWorkScheduleRepository.findAssignmentsByEmployeeId(
        employeeId,
      );
    const dtos = assignments.map((a) => new EmployeeWorkScheduleDto(a));
    return ApiResponseDto.success(
      dtos,
      'Employee assignments retrieved successfully',
    );
  }

  @Get('assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a specific assignment by ID',
    description: 'Returns details of a specific schedule assignment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment retrieved successfully',
    type: ApiResponseDto,
  })
  async getAssignmentById(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<ApiResponseDto<EmployeeWorkScheduleDto>> {
    const assignment =
      await this.employeeWorkScheduleRepository.findById(assignmentId);
    if (!assignment) {
      throw new BusinessException(
        'ASSIGNMENT_NOT_FOUND',
        'Schedule assignment not found.',
        404,
      );
    }
    return ApiResponseDto.success(
      new EmployeeWorkScheduleDto(assignment),
      'Assignment retrieved successfully',
    );
  }

  @Delete('assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove schedule assignment from employee',
    description:
      'Removes the schedule assignment and deletes all future shifts that have not been checked in yet.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment removed successfully',
    type: ApiResponseDto,
  })
  async removeAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<ApiResponseDto<void>> {
    return this.removeScheduleAssignmentUseCase.execute(assignmentId);
  }

  @Put('assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update schedule assignment dates',
    description:
      'Updates effective_from and/or effective_to dates. Deletes shifts outside the new date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
    type: ApiResponseDto,
  })
  async updateAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: UpdateAssignmentDatesDto,
  ): Promise<ApiResponseDto<void>> {
    return this.updateScheduleAssignmentUseCase.execute(assignmentId, dto);
  }

  @Delete('shifts/:shiftId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an employee shift',
    description:
      'Deletes a specific shift (e.g., for leave requests). Cannot delete shifts that have been started.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift deleted successfully',
    type: ApiResponseDto,
  })
  async deleteShift(
    @Param('shiftId', ParseIntPipe) shiftId: number,
  ): Promise<ApiResponseDto<void>> {
    return this.deleteEmployeeShiftUseCase.execute(shiftId);
  }

  @Post('assignments/:assignmentId/overrides')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a schedule override for an assignment' })
  async addOverride(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: AddScheduleOverrideDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    await this.addScheduleOverrideUseCase.execute(assignmentId, dto, user.sub);
    return ApiResponseDto.success(undefined, 'Override added');
  }

  @Get('assignments/:assignmentId/overrides')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List schedule overrides for an assignment' })
  async listOverrides(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ): Promise<ApiResponseDto<ScheduleOverrideDto[]>> {
    const data = await this.listScheduleOverridesUseCase.execute(assignmentId);
    return ApiResponseDto.success(data, 'Overrides retrieved');
  }

  @Delete('assignments/:assignmentId/overrides/:overrideId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a schedule override from an assignment' })
  async removeOverride(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('overrideId') overrideId: string,
  ): Promise<ApiResponseDto<void>> {
    await this.removeScheduleOverrideUseCase.execute(assignmentId, overrideId);
    return ApiResponseDto.success(undefined, 'Override removed');
  }
}
