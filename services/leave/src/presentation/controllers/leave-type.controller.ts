import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { CreateLeaveTypeUseCase } from '../../application/leave-type/use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from '../../application/leave-type/use-cases/get-leave-types.use-case';
import { UpdateLeaveTypeUseCase } from '../../application/leave-type/use-cases/update-leave-type.use-case';
import { GetLeaveTypeByIdUseCase } from '../../application/leave-type/use-cases/get-leave-type-by-id.use-case';
import { DeleteLeaveTypeUseCase } from '../../application/leave-type/use-cases/delete-leave-type.use-case';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, ListLeaveTypesQueryDto, LeaveTypeResponseDto, LeaveTypeStatus } from '../../application/leave-type/dto/leave-type.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';

@Controller('leave-types')
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly getLeaveTypesUseCase: GetLeaveTypesUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
    private readonly getLeaveTypeByIdUseCase: GetLeaveTypeByIdUseCase,
    private readonly deleteLeaveTypeUseCase: DeleteLeaveTypeUseCase,
  ) {}

  @Get()
  async getLeaveTypes(@Query() query: ListLeaveTypesQueryDto): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const data = await this.getLeaveTypesUseCase.execute(query);
    return ApiResponseDto.success(data, 'Leave types retrieved successfully');
  }

  @Post()
  async createLeaveType(@Body() dto: CreateLeaveTypeDto): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.createLeaveTypeUseCase.execute(dto);
    return ApiResponseDto.success(data, 'Leave type created successfully', HttpStatus.CREATED);
  }

  @Put(':id')
  async updateLeaveType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveTypeDto): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.updateLeaveTypeUseCase.execute(id, dto);
    return ApiResponseDto.success(data, 'Leave type updated successfully');
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const data = await this.getLeaveTypeByIdUseCase.execute(id);
    return ApiResponseDto.success(data, 'Leave type retrieved successfully');
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.deleteLeaveTypeUseCase.execute(id);
    return ApiResponseDto.success(null, 'Leave type deleted successfully');
  }

  @Get('active')
  async getActive(): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const data = await this.getLeaveTypesUseCase.execute({ status: LeaveTypeStatus.ACTIVE });
    return ApiResponseDto.success(data, 'Active leave types retrieved successfully');
  }
}
