import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';

@Controller()
export class GetEmployeeListener {
  constructor(
    private readonly getEmployeeDetailUseCase: GetEmployeeDetailUseCase,
  ) {}

  @MessagePattern({ cmd: 'get_employee_by_id' })
  async handleGetEmployeeById(data: { id: number }): Promise<any> {
    console.log(
      `📬 Received RPC request: get_employee_by_id for id: ${data.id}`,
    );

    try {
      const result = await this.getEmployeeDetailUseCase.execute(data.id);

      if (!result) {
        console.log(`❌ Employee not found: ${data.id}`);
        return null;
      }

      console.log(`✅ Employee found: ${result.employee_code}`);
      return result; // Return the EmployeeDetailDto directly
    } catch (error: any) {
      console.error(`❌ Error fetching employee: ${error.message}`);
      return null;
    }
  }
}
