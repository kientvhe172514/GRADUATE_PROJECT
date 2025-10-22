import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingStepRepositoryPort } from '../../../application/ports/onboarding-step.repository.port';
import { EmployeeOnboardingStep } from '../../../domain/entities/employee-onboarding-step.entity';
import { EmployeeOnboardingStepSchema } from '../typeorm/employee-onboarding-step.schema';

@Injectable()
export class PostgresOnboardingStepRepository implements OnboardingStepRepositoryPort {
  constructor(
    @InjectRepository(EmployeeOnboardingStepSchema)
    private readonly repository: Repository<EmployeeOnboardingStep>,
  ) {}

  async findByEmployeeId(employeeId: number): Promise<EmployeeOnboardingStep[]> {
    return this.repository.find({
      where: { employee_id: employeeId },
      order: { created_at: 'ASC' },
    });
  }

  async findById(id: number): Promise<EmployeeOnboardingStep | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByEmployeeIdAndStepName(employeeId: number, stepName: string): Promise<EmployeeOnboardingStep | null> {
    return this.repository.findOne({
      where: { 
        employee_id: employeeId,
        step_name: stepName
      }
    });
  }

  async update(id: number, step: Partial<EmployeeOnboardingStep>): Promise<EmployeeOnboardingStep> {
    await this.repository.update(id, {
      ...step,
      updated_at: new Date(),
      completed_at: step.status === 'COMPLETED' ? new Date() : undefined,
    });

    const updatedStep = await this.findById(id);
    if (!updatedStep) {
      throw new Error(`Onboarding step with id ${id} not found after update`);
    }
    
    return updatedStep;
  }
}