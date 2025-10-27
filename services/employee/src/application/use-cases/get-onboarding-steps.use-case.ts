import { Injectable, Inject } from '@nestjs/common';
import { OnboardingStepRepositoryPort } from '../ports/onboarding-step.repository.port';
import { ONBOARDING_STEP_REPOSITORY } from '../tokens';
import { EmployeeOnboardingStep } from '../../domain/entities/employee-onboarding-step.entity';

@Injectable()
export class GetOnboardingStepsUseCase {
  constructor(
    @Inject(ONBOARDING_STEP_REPOSITORY)
    private onboardingStepRepository: OnboardingStepRepositoryPort,
  ) {}

  async execute(employeeId: number): Promise<EmployeeOnboardingStep[]> {
    return this.onboardingStepRepository.findByEmployeeId(employeeId);
  }
}