import { Injectable } from '@nestjs/common';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { CreateAccountDto } from '../dto/create-account.dto';

export class EmployeeCreatedEventDto {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  hire_date: Date;
}

@Injectable()
export class EmployeeCreatedHandler {
  constructor(private createAccountUseCase: CreateAccountUseCase) {}

  async handle(event: EmployeeCreatedEventDto): Promise<void> {
    const dto = new CreateAccountDto();
    dto.email = event.email;
    dto.employee_id = event.id;
    dto.employee_code = event.employee_code;
    dto.full_name = event.full_name;
    await this.createAccountUseCase.execute(dto);
  }
}