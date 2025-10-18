export enum OnboardingStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export class EmployeeOnboardingStep {
  id?: number;
  employee_id: number;
  
  step_name: string;
  status: OnboardingStepStatus = OnboardingStepStatus.PENDING;
  
  completed_at?: Date;
  notes?: string;
  
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<EmployeeOnboardingStep>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
    this.updated_at = this.updated_at || new Date();
  }

  isCompleted(): boolean {
    return this.status === OnboardingStepStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === OnboardingStepStatus.PENDING;
  }

  markAsCompleted(notes?: string): void {
    this.status = OnboardingStepStatus.COMPLETED;
    this.completed_at = new Date();
    if (notes) this.notes = notes;
    this.updateTimestamp();
  }

  markAsInProgress(): void {
    this.status = OnboardingStepStatus.IN_PROGRESS;
    this.updateTimestamp();
  }

  skip(notes?: string): void {
    this.status = OnboardingStepStatus.SKIPPED;
    if (notes) this.notes = notes;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.updated_at = new Date();
  }
}
