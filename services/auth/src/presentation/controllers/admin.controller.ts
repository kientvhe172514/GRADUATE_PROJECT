import { Controller, Get, Put, Body, Param, Query, HttpCode, HttpStatus, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ListAccountsUseCase } from '../../application/use-cases/admin/list-accounts.use-case';
import { GetAccountDetailUseCase } from '../../application/use-cases/admin/get-account-detail.use-case';
import { UpdateAccountStatusUseCase } from '../../application/use-cases/admin/update-account-status.use-case';
import { ListAuditLogsUseCase } from '../../application/use-cases/admin/list-audit-logs.use-case';
import { 
  ListAccountsRequestDto, 
  ListAccountsResponseDto 
} from '../../application/dto/admin/list-accounts.dto';
import { GetAccountDetailResponseDto } from '../../application/dto/admin/get-account-detail.dto';
import { 
  UpdateAccountStatusDto, 
  UpdateAccountStatusResponseDto 
} from '../../application/dto/admin/update-account-status.dto';
import { 
  ListAuditLogsRequestDto, 
  ListAuditLogsResponseDto 
} from '../../application/dto/admin/list-audit-logs.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private listAccountsUseCase: ListAccountsUseCase,
    private getAccountDetailUseCase: GetAccountDetailUseCase,
    private updateAccountStatusUseCase: UpdateAccountStatusUseCase,
    private listAuditLogsUseCase: ListAuditLogsUseCase,
  ) {}

  @Get('accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all accounts with pagination and search' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by email or full name' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiQuery({ name: 'department_id', required: false, type: Number, description: 'Filter by department' })
  @ApiQuery({ name: 'sort_by', required: false, type: String, description: 'Sort field (default: created_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  async listAccounts(
    @Query() query: ListAccountsRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<ListAccountsResponseDto>> {
    // Check admin role
    if (user.role !== 'ADMIN') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Admin access required');
    }

    return this.listAccountsUseCase.execute(query);
  }

  @Get('accounts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get account details by ID' })
  @ApiResponse({ status: 200, description: 'Account details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  async getAccountDetail(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<GetAccountDetailResponseDto>> {
    // Check admin role
    if (user.role !== 'ADMIN') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Admin access required');
    }

    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    return this.getAccountDetailUseCase.execute(accountId);
  }

  @Put('accounts/:id/status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update account status' })
  @ApiResponse({ status: 200, description: 'Account status updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  async updateAccountStatus(
    @Param('id') id: string,
    @Body() body: UpdateAccountStatusDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ): Promise<ApiResponseDto<UpdateAccountStatusResponseDto>> {
    console.log('AdminController: updateAccountStatus called');
    console.log('AdminController: Received body:', body);
    console.log('AdminController: Body status:', body.status);
    console.log('AdminController: Body reason:', body.reason);
    
    // Check admin role
    if (user.role !== 'ADMIN') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Admin access required');
    }

    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.updateAccountStatusUseCase.execute(accountId, body, user.id, ipAddress, userAgent);
  }

  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'account_id', required: false, type: Number, description: 'Filter by account ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action' })
  @ApiQuery({ name: 'success', required: false, type: Boolean, description: 'Filter by success status' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'sort_by', required: false, type: String, description: 'Sort field (default: created_at)' })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  async listAuditLogs(
    @Query() query: ListAuditLogsRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<ListAuditLogsResponseDto>> {
    // Check admin role
    if (user.role !== 'ADMIN') {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Admin access required');
    }

    return this.listAuditLogsUseCase.execute(query);
  }
}
