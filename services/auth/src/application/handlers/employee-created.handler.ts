import { Injectable } from '@nestjs/common';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { CreateAccountDto } from '../dto/create-account.dto';

export class EmployeeCreatedEventDto {
  id: number;
  employee_code: string;
  full_name: string;
  email: string; // Company email
  personal_email?: string; // Personal email for sending credentials
  hire_date: Date;
  suggested_role?: string; // Role from position for RBAC
}

@Injectable()
export class EmployeeCreatedHandler {
  constructor(private createAccountUseCase: CreateAccountUseCase) {}

  async handle(event: EmployeeCreatedEventDto): Promise<void> {
    console.log(
      `📬 Received employee_created event for ${event.email} with role: ${event.suggested_role || 'EMPLOYEE'}`,
    );

    const dto = new CreateAccountDto();
    dto.email = event.email; // Company email (used for login)
    dto.employee_id = event.id;
    dto.employee_code = event.employee_code;
    dto.full_name = event.full_name;
    dto.personal_email = event.personal_email; // Personal email (used for sending credentials)
    dto.suggested_role = event.suggested_role || 'EMPLOYEE'; // Pass role from position

    // Log which email will receive the credentials
    if (event.personal_email) {
      console.log(
        `📧 Credentials will be sent to personal email: ${event.personal_email}`,
      );
    } else {
      console.log(
        `📧 Credentials will be sent to company email: ${event.email}`,
      );
    }

    await this.createAccountUseCase.execute(dto);
  }
}
