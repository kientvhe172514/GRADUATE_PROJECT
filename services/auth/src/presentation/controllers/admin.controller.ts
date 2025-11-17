import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthPermissions } from '../decorators/auth-permissions.decorator';
import { ListAccountsUseCase } from '../../application/use-cases/admin/list-accounts.use-case';
import { GetAccountDetailUseCase } from '../../application/use-cases/admin/get-account-detail.use-case';
import { UpdateAccountStatusUseCase } from '../../application/use-cases/admin/update-account-status.use-case';
import { AdminUpdateAccountUseCase } from '../../application/use-cases/admin/update-account.use-case';
import { ListAuditLogsUseCase } from '../../application/use-cases/admin/list-audit-logs.use-case';
import {
  ListAccountsRequestDto,
  ListAccountsResponseDto,
} from '../../application/dto/admin/list-accounts.dto';
import { GetAccountDetailResponseDto } from '../../application/dto/admin/get-account-detail.dto';
import {
  UpdateAccountStatusDto,
  UpdateAccountStatusResponseDto,
} from '../../application/dto/admin/update-account-status.dto';
import {
  AdminUpdateAccountDto,
  AdminUpdateAccountResponseDto,
} from '../../application/dto/admin/update-account.dto';
import {
  ListAuditLogsRequestDto,
  ListAuditLogsResponseDto,
} from '../../application/dto/admin/list-audit-logs.dto';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private listAccountsUseCase: ListAccountsUseCase,
    private getAccountDetailUseCase: GetAccountDetailUseCase,
    private updateAccountStatusUseCase: UpdateAccountStatusUseCase,
    private adminUpdateAccountUseCase: AdminUpdateAccountUseCase,
    private listAuditLogsUseCase: ListAuditLogsUseCase,
  ) {}

  @Get('accounts')
  @HttpCode(HttpStatus.OK)
  @AuthPermissions('admin.accounts.read')
  @ApiOperation({ summary: 'Get all accounts with pagination and search' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by email or full name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'department_id',
    required: false,
    type: Number,
    description: 'Filter by department',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    type: String,
    description: 'Sort field (default: created_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })

  async listAccounts(
    @Query() query: ListAccountsRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<ListAccountsResponseDto>> {
    return this.listAccountsUseCase.execute(query);
  }

  @Get('accounts/:id')
  @HttpCode(HttpStatus.OK)
  @AuthPermissions('admin.accounts.read')
  @ApiOperation({ summary: 'Get account details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  async getAccountDetail(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<GetAccountDetailResponseDto>> {
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    return this.getAccountDetailUseCase.execute(accountId);
  }

  @Put('accounts/:id')
  @HttpCode(HttpStatus.OK)
  @AuthPermissions('admin.accounts.update')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ 
    summary: 'Update account information including role assignment',
    description: `
      **Admin endpoint to update account information**
      
      Features:
      - ✅ Update email (with duplicate check)
      - ✅ Assign/change role (SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
      - ✅ Update account status (ACTIVE, INACTIVE, LOCKED, SUSPENDED)
      - ✅ Update employee linking (employee_id, employee_code)
      - ✅ Update department and position
      - ✅ Update external IDs and metadata
      - ✅ Audit logging for all changes
      - ✅ Event publishing for integration
      
      **Valid Roles:**
      - SUPER_ADMIN: Full system access
      - ADMIN: System administrator
      - HR_MANAGER: Human resources manager
      - DEPARTMENT_MANAGER: Department manager
      - EMPLOYEE: Regular employee
      
      **Valid Statuses:**
      - ACTIVE: Account is active
      - INACTIVE: Account is disabled
      - LOCKED: Account is temporarily locked
      - SUSPENDED: Account is suspended
      
      **Required Permission:** admin.accounts.update
    `
  })
  @ApiResponse({
    status: 200,
    type: AdminUpdateAccountResponseDto,
    description: 'Account updated successfully',
    schema: {
      example: {
        status: 'SUCCESS',
        statusCode: 200,
        message: 'Account updated successfully',
        data: {
          id: 1,
          email: 'user@zentry.com',
          full_name: 'Nguyễn Văn A',
          role: 'HR_MANAGER',
          status: 'ACTIVE',
          employee_id: 123,
          employee_code: 'EMP001',
          department_id: 1,
          department_name: 'Human Resources',
          position_id: 5,
          position_name: 'HR Manager',
          sync_version: 2,
          updated_at: '2025-11-17T10:30:00.000Z'
        },
        timestamp: '2025-11-17T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Invalid role or validation error' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  async updateAccount(
    @Param('id') id: string,
    @Body() body: AdminUpdateAccountDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ): Promise<ApiResponseDto<AdminUpdateAccountResponseDto>> {
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.adminUpdateAccountUseCase.execute(
      accountId,
      body,
      user.sub,
      ipAddress,
      userAgent,
    );
  }

  @Put('accounts/:id/status')
  @HttpCode(HttpStatus.OK)
  @AuthPermissions('admin.accounts.update')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Update account status only (quick action)' })
  @ApiResponse({
    status: 200,
    description: 'Account status updated successfully',
  })
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

    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
    }

    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.updateAccountStatusUseCase.execute(
      accountId,
      body,
      user.sub,
      ipAddress,
      userAgent,
    );
  }

  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  @AuthPermissions('admin.audit-logs.read')
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'account_id',
    required: false,
    type: Number,
    description: 'Filter by account ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: 'Filter by action',
  })
  @ApiQuery({
    name: 'success',
    required: false,
    type: Boolean,
    description: 'Filter by success status',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    type: String,
    description: 'Sort field (default: created_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  async listAuditLogs(
    @Query() query: ListAuditLogsRequestDto,
    @CurrentUser() user: any,
  ): Promise<ApiResponseDto<ListAuditLogsResponseDto>> {
    return this.listAuditLogsUseCase.execute(query);
  }
}
