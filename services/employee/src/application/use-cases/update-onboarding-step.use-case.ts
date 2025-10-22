import { Injectable, Inject } from '@nestjs/common';
import { OnboardingStepRepositoryPort } from '../ports/onboarding-step.repository.port';
import { ONBOARDING_STEP_REPOSITORY } from '../tokens';
import { UpdateOnboardingStepDto } from '../dto/onboarding/update-onboarding-step.dto';
import { EmployeeOnboardingStep, OnboardingStepStatus } from '../../domain/entities/employee-onboarding-step.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';

@Injectable()
export class UpdateOnboardingStepUseCase {
  constructor(
    @Inject(ONBOARDING_STEP_REPOSITORY)
    private onboardingStepRepository: OnboardingStepRepositoryPort,
  ) {}

  async execute(employeeId: number, stepName: string, dto: UpdateOnboardingStepDto): Promise<EmployeeOnboardingStep> {
    const step = await this.onboardingStepRepository.findByEmployeeIdAndStepName(employeeId, stepName);
    if (!step || !step.id) {
      throw new BusinessException(ErrorCodes.NOT_FOUND, 'Onboarding step not found');
    }

    if (dto.status === OnboardingStepStatus.COMPLETED) {
      step.markAsCompleted(dto.notes);
    } else if (dto.status === OnboardingStepStatus.IN_PROGRESS) {
      step.markAsInProgress();
      step.notes = dto.notes || step.notes;
    } else if (dto.status === OnboardingStepStatus.SKIPPED) {
      step.skip(dto.notes);
    }

    return this.onboardingStepRepository.update(step.id, {
      status: step.status,
      notes: step.notes,
      completed_at: step.completed_at,
    });
  }
}