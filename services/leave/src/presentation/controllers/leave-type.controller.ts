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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { CreateLeaveTypeUseCase } from '../../application/leave-type/use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from '../../application/leave-type/use-cases/get-leave-types.use-case';
import { GetLeaveTypeByIdUseCase } from '../../application/leave-type/use-cases/get-leave-type-by-id.use-case';
import { UpdateLeaveTypeUseCase } from '../../application/leave-type/use-cases/update-leave-type.use-case';
import { DeleteLeaveTypeUseCase } from '../../application/leave-type/use-cases/delete-leave-type.use-case';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../../application/leave-type/dto/leave-type.dto';
import { GetLeaveTypesQueryDto } from '../../application/leave-type/dto/get-leave-types-query.dto';
import { LeaveTypeResponseDto, CreateLeaveTypeResponseDto, UpdateLeaveTypeResponseDto } from '../../application/leave-type/dto/leave-type-response.dto';

@ApiTags('leave-types')
@Controller('leave-types')
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly getLeaveTypesUseCase: GetLeaveTypesUseCase,
    private readonly getLeaveTypeByIdUseCase: GetLeaveTypeByIdUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
    private readonly deleteLeaveTypeUseCase: DeleteLeaveTypeUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all leave types', description: 'Lấy danh sách tất cả loại nghỉ phép trong hệ thống' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Chỉ lấy leave types đang active (default: false)' })
  @ApiResponse({
    status: 200,
    description: 'Leave types retrieved successfully',
    type: [LeaveTypeResponseDto],
  })
  async getLeaveTypes(@Query() query: GetLeaveTypesQueryDto): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const activeOnly = query.active ?? false;
    const result = await this.getLeaveTypesUseCase.execute(activeOnly);

    return ApiResponseDto.success(result, 'Leave types retrieved successfully');
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active leave types', description: 'Lấy danh sách leave types đang active (cho dropdown)' })
  @ApiResponse({
    status: 200,
    description: 'Active leave types retrieved successfully',
    type: [LeaveTypeResponseDto],
  })
  async getActiveLeaveTypes(): Promise<ApiResponseDto<LeaveTypeResponseDto[]>> {
    const result = await this.getLeaveTypesUseCase.execute(true);

    return ApiResponseDto.success(result, 'Active leave types retrieved successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave type by ID', description: 'Xem chi tiết leave type' })
  @ApiResponse({
    status: 200,
    description: 'Leave type retrieved successfully',
    type: LeaveTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async getLeaveTypeById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<LeaveTypeResponseDto>> {
    const result = await this.getLeaveTypeByIdUseCase.execute(id);

    return ApiResponseDto.success(result, 'Leave type retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create leave type', description: 'Tạo loại nghỉ phép mới (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Leave type created successfully',
    type: CreateLeaveTypeResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Leave type code already exists' })
  async createLeaveType(@Body() dto: CreateLeaveTypeDto): Promise<ApiResponseDto<CreateLeaveTypeResponseDto>> {
    const result = await this.createLeaveTypeUseCase.execute(dto);

    return ApiResponseDto.success(result, 'Leave type created successfully', 201);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update leave type', description: 'Cập nhật thông tin loại nghỉ phép' })
  @ApiResponse({
    status: 200,
    description: 'Leave type updated successfully',
    type: UpdateLeaveTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async updateLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveTypeDto,
  ): Promise<ApiResponseDto<UpdateLeaveTypeResponseDto>> {
    const result = await this.updateLeaveTypeUseCase.execute(id, dto);

    return ApiResponseDto.success(result, 'Leave type updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete leave type', description: 'Xóa loại nghỉ phép' })
  @ApiResponse({
    status: 200,
    description: 'Leave type deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async deleteLeaveType(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.deleteLeaveTypeUseCase.execute(id);

    return ApiResponseDto.success(null, 'Leave type deleted successfully');
  }
}
