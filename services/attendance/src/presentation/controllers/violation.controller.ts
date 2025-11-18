import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Permissions } from '@graduate-project/shared-common';
import { ViolationRepository } from '../../infrastructure/repositories/violation.repository';
import { ResolveViolationDto, ViolationQueryDto } from '../dtos/violation.dto';

@ApiTags('Violations')
@ApiBearerAuth()
@Controller('violations')
export class ViolationController {
  constructor(private readonly violationRepository: ViolationRepository) {}

  @Get('my-violations')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get my violations (Employee)' })
  @ApiResponse({
    status: 200,
    description: 'Your violations retrieved successfully',
  })
  async getMyViolations(
    @CurrentUser() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const violations = await this.violationRepository.findByEmployeeId(
      user.employee_id!,
      limit,
      offset,
    );

    const total = await this.violationRepository.countByEmployeeId(
      user.employee_id!,
    );

    return {
      success: true,
      message: 'Your violations retrieved successfully',
      data: violations,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get all violations (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Violations retrieved successfully',
  })
  async getAllViolations(@Query() query: ViolationQueryDto) {
    let violations;

    if (query.employee_id) {
      violations = await this.violationRepository.findByEmployeeId(
        query.employee_id,
        query.limit ?? 50,
        query.offset ?? 0,
      );
    } else if (query.unresolved_only) {
      violations = await this.violationRepository.findUnresolvedViolations(
        query.limit ?? 50,
        query.offset ?? 0,
      );
    } else {
      violations = await this.violationRepository.find({
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        order: { detected_at: 'DESC' },
      });
    }

    return {
      success: true,
      message: 'Violations retrieved successfully',
      data: violations,
      pagination: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total: violations.length,
      },
    };
  }

  @Get('statistics')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get violation statistics (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(
    @Query('employee_id', new ParseIntPipe({ optional: true }))
    employeeId?: number,
  ) {
    const statistics =
      await this.violationRepository.getViolationStatistics(employeeId);

    return {
      success: true,
      message: 'Violation statistics retrieved successfully',
      data: statistics,
    };
  }

  @Get('top-violators')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get top violators (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Top violators retrieved successfully',
  })
  async getTopViolators(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const topViolators = await this.violationRepository.getTopViolators(limit);

    return {
      success: true,
      message: 'Top violators retrieved successfully',
      data: topViolators,
    };
  }

  @Get('employee/:employeeId')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get violations by employee (HR/Manager)' })
  @ApiResponse({
    status: 200,
    description: 'Employee violations retrieved successfully',
  })
  async getEmployeeViolations(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    const violations = await this.violationRepository.findByEmployeeId(
      employeeId,
      limit,
      offset,
    );

    const total = await this.violationRepository.countByEmployeeId(employeeId);

    return {
      success: true,
      message: 'Employee violations retrieved successfully',
      data: violations,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Get violation details' })
  @ApiResponse({ status: 200, description: 'Violation retrieved successfully' })
  async getViolationById(@Param('id', ParseIntPipe) id: number) {
    const violation = await this.violationRepository.findOne({ where: { id } });

    if (!violation) {
      return {
        success: false,
        message: 'Violation not found',
      };
    }

    return {
      success: true,
      message: 'Violation retrieved successfully',
      data: violation,
    };
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)

  @ApiOperation({ summary: 'Resolve violation (HR/Manager)' })
  @ApiResponse({ status: 200, description: 'Violation resolved successfully' })
  async resolveViolation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveViolationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const resolved = await this.violationRepository.resolveViolation(
      id,
      user.employee_id!,
      dto.resolution_notes,
    );

    if (!resolved) {
      return {
        success: false,
        message: 'Violation not found or resolution failed',
      };
    }

    return {
      success: true,
      message: 'Violation resolved successfully',
    };
  }
}
