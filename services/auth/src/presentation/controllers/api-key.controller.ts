import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions, CurrentUser, JwtPayload } from '@graduate-project/shared-common';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyRepositoryPort } from '../../application/ports/api-key.repository.port';
import { API_KEY_REPOSITORY } from '../../application/tokens';
import * as crypto from 'crypto';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApiKeyController {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private apiKeyRepository: ApiKeyRepositoryPort,
  ) {}

  @Get()
  @Permissions('api_key.read')
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiQuery({ name: 'status', required: false, example: 'active', description: 'Filter by status' })
  @ApiQuery({ name: 'service_name', required: false, example: 'face-recognition', description: 'Filter by service name' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Items per page' })
  async getAllApiKeys(
    @Query('status') status?: string,
    @Query('service_name') serviceName?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const { apiKeys, total } = await this.apiKeyRepository.findAll({ status, page, limit });
    return {
      message: 'Get all API keys',
      data: apiKeys,
      pagination: { page, limit, total },
    };
  }

  @Get(':id')
  @Permissions('api_key.read')
  async getApiKeyById(@Param('id') id: number) {
    const apiKey = await this.apiKeyRepository.findById(id);
    return {
      message: 'Get API key by ID',
      data: apiKey,
    };
  }

  @Get(':id/usage-stats')
  @Permissions('api_key.read')
  @ApiOperation({ summary: 'Get usage statistics for an API key' })
  async getApiKeyUsageStats(@Param('id') id: number) {
    const stats = await this.apiKeyRepository.getUsageStats(id);
    return {
      message: 'Get API key usage stats',
      data: stats,
    };
  }

  @Post()
  @Permissions('api_key.create')
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(@Body() dto: CreateApiKeyDto, @CurrentUser() user: JwtPayload) {
    // TODO: Implement create API key
    // Generate random API key: `zentry_${crypto.randomBytes(32).toString('hex')}`
    // Hash the key with bcrypt before saving to DB
    // Return plain key ONLY ONCE (on creation)
    // Validate: permissions must exist in permissions table
    
    const plainKey = `zentry_${crypto.randomBytes(32).toString('hex')}`;
    
    return {
      message: 'API key created successfully',
      data: {
        id: 1,
        service_name: dto.service_name,
        api_key: plainKey, // ⚠️ ONLY returned on creation
        permissions: dto.permissions,
        expires_at: dto.expires_at,
      },
      warning: 'Save this API key securely. It will not be shown again.',
    };
  }

  @Put(':id')
  @Permissions('api_key.update')
  async updateApiKey(
    @Param('id') id: number,
    @Body() dto: UpdateApiKeyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // TODO: Implement update API key
    // Can update: description, allowed_ips, rate_limit, permissions, scope, status, expires_at
    // Cannot update: key_hash, service_name
    return {
      message: 'API key updated successfully',
      data: { id, ...dto, updated_by: user.sub },
    };
  }

  @Delete(':id')
  @Permissions('api_key.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApiKey(@Param('id') id: number) {
    // TODO: Implement delete (or revoke) API key
    // Soft delete: set status = 'revoked', revoked_at = now, revoked_by = current_user
    return { message: 'API key revoked successfully' };
  }

  @Post(':id/regenerate')
  @Permissions('api_key.create')
  async regenerateApiKey(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    // TODO: Implement regenerate API key
    // Generate new random key, hash it, update key_hash
    // Return plain key ONLY ONCE
    
    const plainKey = `zentry_${crypto.randomBytes(32).toString('hex')}`;
    
    return {
      message: 'API key regenerated successfully',
      data: {
        id,
        api_key: plainKey, // ⚠️ ONLY returned on regeneration
      },
      warning: 'Save this API key securely. It will not be shown again.',
    };
  }

  @Post(':id/rotate')
  @Permissions('api_key.create')
  async rotateApiKey(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
    // TODO: Implement rotate API key (graceful rotation)
    // Create a new API key with same permissions
    // Mark old one as 'rotating' status with 7-day grace period
    // After 7 days, automatically revoke old key
    
    const plainKey = `zentry_${crypto.randomBytes(32).toString('hex')}`;
    
    return {
      message: 'API key rotated successfully',
      data: {
        new_key: {
          id: 2,
          api_key: plainKey,
          service_name: 'example-service',
        },
        old_key: {
          id,
          status: 'rotating',
          revokes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      warning: 'Old key will be revoked in 7 days. Update your services to use the new key.',
    };
  }
}
