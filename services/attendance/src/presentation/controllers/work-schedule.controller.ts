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
} from '@graduate-project/shared-common';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  AssignWorkScheduleDto,
  ListWorkScheduleDto,
  WorkScheduleDto,
  UpdateAssignmentDatesDto,
} from '../../application/dtos/work-schedule.dto';
import { CreateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/create-work-schedule.use-case';
import { UpdateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/update-work-schedule.use-case';
import { ListWorkSchedulesUseCase } from '../../application/use-cases/work-schedule/list-work-schedules.use-case';
import { GetWorkScheduleByIdUseCase } from '../../application/use-cases/work-schedule/get-work-schedule-by-id.use-case';
import { DeleteWorkScheduleUseCase } from '../../application/use-cases/work-schedule/delete-work-schedule.use-case';
import { AssignScheduleToEmployeesUseCase } from '../../application/use-cases/work-schedule/assign-schedule-to-employees.use-case';
import { RemoveScheduleAssignmentUseCase } from '../../application/use-cases/work-schedule/remove-schedule-assignment.use-case';
import { UpdateScheduleAssignmentUseCase } from '../../application/use-cases/work-schedule/update-schedule-assignment.use-case';
import { DeleteEmployeeShiftUseCase } from '../../application/use-cases/work-schedule/delete-employee-shift.use-case';

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
}
