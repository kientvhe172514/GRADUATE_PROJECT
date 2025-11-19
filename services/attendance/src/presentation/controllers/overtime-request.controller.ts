import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { ApiResponseDto, CurrentUser, JwtPayload, Permissions } from '@graduate-project/shared-common';
import {
  CreateOvertimeRequestDto,
  OvertimeQueryDto,
  RejectOvertimeDto,
  UpdateOvertimeRequestDto,
} from '../../application/dtos/overtime-request.dto';
import { CreateOvertimeRequestUseCase } from '../../application/use-cases/overtime/create-overtime-request.use-case';
import { GetMyOvertimeRequestsUseCase } from '../../application/use-cases/overtime/get-my-overtime-requests.use-case';
import { ListOvertimeRequestsUseCase } from '../../application/use-cases/overtime/list-overtime-requests.use-case';
import { GetPendingOvertimeRequestsUseCase } from '../../application/use-cases/overtime/get-pending-overtime-requests.use-case';
import { GetOvertimeRequestByIdUseCase } from '../../application/use-cases/overtime/get-overtime-request-by-id.use-case';
import { UpdateOvertimeRequestUseCase } from '../../application/use-cases/overtime/update-overtime-request.use-case';
import { ApproveOvertimeRequestUseCase } from '../../application/use-cases/overtime/approve-overtime-request.use-case';
import { RejectOvertimeRequestUseCase } from '../../application/use-cases/overtime/reject-overtime-request.use-case';
import { CancelOvertimeRequestUseCase } from '../../application/use-cases/overtime/cancel-overtime-request.use-case';
@ApiTags('Overtime Requests')
@ApiBearerAuth()
@Controller('overtime-requests')
export class OvertimeRequestController {
  constructor(
    private readonly createOvertimeRequestUseCase: CreateOvertimeRequestUseCase,
    private readonly getMyOvertimeRequestsUseCase: GetMyOvertimeRequestsUseCase,
    private readonly listOvertimeRequestsUseCase: ListOvertimeRequestsUseCase,
    private readonly getPendingOvertimeRequestsUseCase: GetPendingOvertimeRequestsUseCase,
    private readonly getOvertimeRequestByIdUseCase: GetOvertimeRequestByIdUseCase,
    private readonly updateOvertimeRequestUseCase: UpdateOvertimeRequestUseCase,
    private readonly approveOvertimeRequestUseCase: ApproveOvertimeRequestUseCase,
    private readonly rejectOvertimeRequestUseCase: RejectOvertimeRequestUseCase,
    private readonly cancelOvertimeRequestUseCase: CancelOvertimeRequestUseCase,
  ) {}

  @Post()
  @Permissions('overtime.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create overtime request (Employee)' })
  @ApiResponse({ status: 201, type: ApiResponseDto })
  async createRequest(
    @Body() dto: CreateOvertimeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    return this.createOvertimeRequestUseCase.execute(dto, user);
  }

  @Get('my-requests')
  @Permissions('overtime.read_own')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my overtime requests (Employee)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getMyRequests(
    @CurrentUser() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    return this.getMyOvertimeRequestsUseCase.execute(user, limit, offset);
  }

  @Get()
  @Permissions('overtime.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all overtime requests (HR/Manager)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getAllRequests(
    @Query() query: OvertimeQueryDto,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    return this.listOvertimeRequestsUseCase.execute(query);
  }

  @Get('pending')
  @Permissions('overtime.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending overtime requests (HR/Manager)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getPendingRequests(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    return this.getPendingOvertimeRequestsUseCase.execute(limit, offset);
  }

  @Get(':id')
  @Permissions('overtime.read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get overtime request details' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async getRequestById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<any>> {
    return this.getOvertimeRequestByIdUseCase.execute(id);
  }

  @Put(':id')
  @Permissions('overtime.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update overtime request (Employee - before approval)',
  })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async updateRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOvertimeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.updateOvertimeRequestUseCase.execute(id, dto, user);
  }

  @Post(':id/approve')
  @Permissions('overtime.approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve overtime request (HR/Manager)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.approveOvertimeRequestUseCase.execute(id, user);
  }

  @Post(':id/reject')
  @Permissions('overtime.reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject overtime request (HR/Manager)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectOvertimeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.rejectOvertimeRequestUseCase.execute(id, dto, user);
  }

  @Post(':id/cancel')
  @Permissions('overtime.cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel your own overtime request (Employee)' })
  @ApiResponse({ status: 200, type: ApiResponseDto })
  async cancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    return this.cancelOvertimeRequestUseCase.execute(id, user);
  }
}
