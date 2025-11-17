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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Permissions, ApiResponseDto } from '@graduate-project/shared-common';
import {
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  AssignWorkScheduleDto,
  ListWorkScheduleDto,
  WorkScheduleDto,
} from '../../application/dtos/work-schedule.dto';
import { CreateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/create-work-schedule.use-case';
import { UpdateWorkScheduleUseCase } from '../../application/use-cases/work-schedule/update-work-schedule.use-case';
import { ListWorkSchedulesUseCase } from '../../application/use-cases/work-schedule/list-work-schedules.use-case';
import { GetWorkScheduleByIdUseCase } from '../../application/use-cases/work-schedule/get-work-schedule-by-id.use-case';
import { DeleteWorkScheduleUseCase } from '../../application/use-cases/work-schedule/delete-work-schedule.use-case';
import { AssignScheduleToEmployeesUseCase } from '../../application/use-cases/work-schedule/assign-schedule-to-employees.use-case';

@ApiTags('Work Schedules')
@ApiBearerAuth()
@Controller('work-schedules')
export class WorkScheduleController {
  constructor(
    private readonly createWorkScheduleUseCase: CreateWorkScheduleUseCase,
    private readonly updateWorkScheduleUseCase: UpdateWorkScheduleUseCase,
    private readonly listWorkSchedulesUseCase: ListWorkSchedulesUseCase,
    private readonly getWorkScheduleByIdUseCase: GetWorkScheduleByIdUseCase,
    private readonly deleteWorkScheduleUseCase: DeleteWorkScheduleUseCase,
    private readonly assignScheduleToEmployeesUseCase: AssignScheduleToEmployeesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('attendance.schedule.create')
  @ApiOperation({ summary: 'Create a new work schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully', type: ApiResponseDto })
  async create(
    @Body() dto: CreateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.createWorkScheduleUseCase.execute(dto, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('attendance.schedule.read')
  @ApiOperation({ summary: 'Get all work schedules with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully', type: ApiResponseDto })
  async findAll(@Query() dto: ListWorkScheduleDto): Promise<ApiResponseDto<{ data: WorkScheduleDto[]; total: number }>> {
    return this.listWorkSchedulesUseCase.execute(dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('attendance.schedule.read')
  @ApiOperation({ summary: 'Get work schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully', type: ApiResponseDto })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.getWorkScheduleByIdUseCase.execute(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('attendance.schedule.update')
  @ApiOperation({ summary: 'Update work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully', type: ApiResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<WorkScheduleDto>> {
    return this.updateWorkScheduleUseCase.execute(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('attendance.schedule.delete')
  @ApiOperation({ summary: 'Deactivate a work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deactivated successfully', type: ApiResponseDto })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.deleteWorkScheduleUseCase.execute(id, user);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @Permissions('attendance.schedule.assign')
  @ApiOperation({ summary: 'Assign a work schedule to employees' })
  @ApiResponse({ status: 200, description: 'Schedule assigned successfully', type: ApiResponseDto })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignWorkScheduleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.assignScheduleToEmployeesUseCase.execute(id, dto, user);
  }
}
