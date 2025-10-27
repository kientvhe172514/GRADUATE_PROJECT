import { EntitySchema } from 'typeorm';
import { EmployeeOnboardingStep } from '../../../domain/entities/employee-onboarding-step.entity';

export const EmployeeOnboardingStepSchema = new EntitySchema<EmployeeOnboardingStep>({
  name: 'EmployeeOnboardingStep',
  tableName: 'employee_onboarding_steps',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true
    },
    employee_id: {
      type: Number
    },
    step_name: {
      type: String,
      length: 100
    },
    status: {
      type: String,
      length: 20,
      default: 'PENDING'
    },
    notes: {
      type: String,
      nullable: true
    },
    completed_at: {
      type: 'timestamp',
      nullable: true
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true
    }
  }
});