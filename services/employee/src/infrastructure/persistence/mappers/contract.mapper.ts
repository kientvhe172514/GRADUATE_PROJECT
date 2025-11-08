import { Contract } from '../../../domain/entities/contract.entity';

export class ContractMapper {
  static toDomain(schema: any): Contract {
    return new Contract({
      id: schema.id,
      employee_id: schema.employee_id,
      contract_number: schema.contract_code,
      contract_type: schema.contract_type,
      start_date: schema.start_date,
      end_date: schema.end_date,
      base_salary: schema.salary,
      currency: schema.currency,
      allowances: schema.allowances,
      status: schema.status,
      signed_date: schema.signed_at,
      created_at: schema.created_at,
      updated_at: schema.updated_at,
    });
  }

  static toSchema(contract: Contract): any {
    return {
      id: contract.id,
      employee_id: contract.employee_id,
      contract_code: contract.contract_number,
      contract_type: contract.contract_type,
      start_date: contract.start_date,
      end_date: contract.end_date,
      salary: contract.base_salary,
      currency: contract.currency || 'VND',
      allowances: contract.allowances,
      status: contract.status,
      signed_at: contract.signed_date,
      created_at: contract.created_at || new Date(),
      updated_at: contract.updated_at || new Date(),
    };
  }
}
