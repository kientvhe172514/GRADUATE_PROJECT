import { EmployeeOnboardingStep } from '../../domain/entities/employee-onboarding-step.entity';

export interface OnboardingStepRepositoryPort {
  findByEmployeeId(employeeId: number): Promise<EmployeeOnboardingStep[]>;
  findById(id: number): Promise<EmployeeOnboardingStep | null>;
  update(id: number, step: Partial<EmployeeOnboardingStep>): Promise<EmployeeOnboardingStep>;
  findByEmployeeIdAndStepName(employeeId: number, stepName: string): Promise<EmployeeOnboardingStep | null>;
}