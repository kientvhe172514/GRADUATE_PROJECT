import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpStatus, ParseIntPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GetAllPositionsUseCase } from '../../application/use-cases/get-all-positions.use-case';
import { GetPositionByIdUseCase } from '../../application/use-cases/get-position-by-id.use-case';
import { CreatePositionUseCase } from '../../application/use-cases/create-position.use-case';
import { UpdatePositionUseCase } from '../../application/use-cases/update-position.use-case';
import { DeletePositionUseCase } from '../../application/use-cases/delete-position.use-case';
import { CreatePositionDto } from '../../application/dto/create-position.dto';
import { UpdatePositionDto } from '../../application/dto/update-position.dto';
import { PositionResponseDto } from '../../application/dto/position-response.dto';
import { PositionListResponseDto } from '../../application/dto/position-list-response.dto';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { ListPositionDto } from '../../application/dto/position/list-position.dto';

@ApiTags('positions')
@ApiBearerAuth('bearer')
@Controller('positions')
export class PositionController {
  constructor(
    private readonly getAllPositionsUseCase: GetAllPositionsUseCase,
    private readonly getPositionByIdUseCase: GetPositionByIdUseCase,
    private readonly createPositionUseCase: CreatePositionUseCase,
    private readonly updatePositionUseCase: UpdatePositionUseCase,
    private readonly deletePositionUseCase: DeletePositionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các chức vụ với filter và pagination' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách chức vụ thành công', type: PositionListResponseDto })
  async getAllPositions(
    @Query() filters?: ListPositionDto,
  ): Promise<ApiResponseDto<any>> {
    return await this.getAllPositionsUseCase.execute(filters || {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một chức vụ' })
  @ApiParam({ name: 'id', type: Number, description: 'ID chức vụ' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin chức vụ thành công', type: PositionResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chức vụ' })
  async getPositionById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.getPositionByIdUseCase.execute(id);
    
    const response: PositionResponseDto = {
      id: position.id,
      position_code: position.position_code,
      position_name: position.position_name,
      description: position.description,
      level: position.level,
      department_id: position.department_id,
      suggested_role: position.suggested_role,
      salary_min: position.salary_min,
      salary_max: position.salary_max,
      currency: position.currency,
      status: position.status,
      created_at: position.created_at || new Date(),
      updated_at: position.updated_at || new Date(),
    };

    return ApiResponseDto.success(response, 'Lấy thông tin chức vụ thành công');
  }

  @Post()
  @ApiOperation({ summary: '(Admin) Tạo một chức vụ mới' })
  @ApiResponse({ status: 201, description: 'Tạo chức vụ thành công', type: PositionResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Mã chức vụ đã tồn tại' })
  async createPosition(@Body() createPositionDto: CreatePositionDto): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.createPositionUseCase.execute(createPositionDto);
    
    const response: PositionResponseDto = {
      id: position.id,
      position_code: position.position_code,
      position_name: position.position_name,
      description: position.description,
      level: position.level,
      department_id: position.department_id,
      suggested_role: position.suggested_role,
      salary_min: position.salary_min,
      salary_max: position.salary_max,
      currency: position.currency,
      status: position.status,
      created_at: position.created_at || new Date(),
      updated_at: position.updated_at || new Date(),
    };

    return ApiResponseDto.success(response, 'Tạo chức vụ thành công', HttpStatus.CREATED);
  }

  @Put(':id')
  @ApiOperation({ summary: '(Admin) Cập nhật thông tin một chức vụ' })
  @ApiParam({ name: 'id', type: Number, description: 'ID chức vụ' })
  @ApiResponse({ status: 200, description: 'Cập nhật chức vụ thành công', type: PositionResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chức vụ' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Mã chức vụ đã tồn tại' })
  async updatePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePositionDto: UpdatePositionDto,
  ): Promise<ApiResponseDto<PositionResponseDto>> {
    const position = await this.updatePositionUseCase.execute(id, updatePositionDto);
    
    const response: PositionResponseDto = {
      id: position.id,
      position_code: position.position_code,
      position_name: position.position_name,
      description: position.description,
      level: position.level,
      department_id: position.department_id,
      suggested_role: position.suggested_role,
      salary_min: position.salary_min,
      salary_max: position.salary_max,
      currency: position.currency,
      status: position.status,
      created_at: position.created_at || new Date(),
      updated_at: position.updated_at || new Date(),
    };

    return ApiResponseDto.success(response, 'Cập nhật chức vụ thành công');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một chức vụ' })
  @ApiParam({ name: 'id', type: Number, description: 'ID chức vụ' })
  @ApiResponse({ status: 200, description: 'Xóa chức vụ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chức vụ' })
  async deletePosition(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.deletePositionUseCase.execute(id);
    return ApiResponseDto.success(null, 'Xóa chức vụ thành công');
  }
}
