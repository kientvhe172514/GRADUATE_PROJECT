import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateLeaveTypeUseCase } from '../../application/leave-type/use-cases/create-leave-type.use-case';
import { GetLeaveTypesUseCase } from '../../application/leave-type/use-cases/get-leave-types.use-case';
import { UpdateLeaveTypeUseCase } from '../../application/leave-type/use-cases/update-leave-type.use-case';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from '../../application/leave-type/dto/leave-type.dto';

@ApiTags('leave-types')
@ApiBearerAuth('bearer')
@Controller('leave-types')
export class LeaveTypeController {
  constructor(
    private readonly createLeaveTypeUseCase: CreateLeaveTypeUseCase,
    private readonly getLeaveTypesUseCase: GetLeaveTypesUseCase,
    private readonly updateLeaveTypeUseCase: UpdateLeaveTypeUseCase,
  ) {}

  @Get()
  async getLeaveTypes(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.getLeaveTypesUseCase.execute(activeOnly);
  }

  @Post()
  async createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.createLeaveTypeUseCase.execute(dto);
  }

  @Put(':id')
  async updateLeaveType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.updateLeaveTypeUseCase.execute(parseInt(id), dto);
  }
}
