import { DigitalContract } from '../../../domain/entities/digital-contract.entity';

export class DigitalContractMapper {
  static toDomain(schema: any): DigitalContract {
    return new DigitalContract({
      id: schema.id,
      contract_id: schema.contract_id,
      employee_id: schema.employee_id || 0,
      contract_number: schema.file_name || '',
      contract_type: schema.mime_type || 'PDF',
      contract_pdf_url: schema.file_url,
      status: schema.is_final ? 'SIGNED' : 'DRAFT',
      employee_signed_at: schema.employee_signed_at,
      employee_signature_data: schema.employee_signature_data ? JSON.stringify(schema.employee_signature_data) : undefined,
      employee_ip_address: schema.employee_signature_ip,
      company_signed_at: schema.employer_signed_at,
      company_signature_data: schema.employer_signature_data ? JSON.stringify(schema.employer_signature_data) : undefined,
      created_at: schema.created_at,
      updated_at: schema.updated_at,
    });
  }

  static toSchema(digitalContract: DigitalContract): any {
    return {
      id: digitalContract.id,
      contract_id: digitalContract.contract_id,
      employee_id: digitalContract.employee_id,
      file_url: digitalContract.contract_pdf_url,
      file_name: digitalContract.contract_number,
      mime_type: digitalContract.contract_type,
      is_final: digitalContract.status === 'SIGNED',
      employee_signed_at: digitalContract.employee_signed_at,
      employee_signature_data: digitalContract.employee_signature_data ? JSON.parse(digitalContract.employee_signature_data) : null,
      employee_signature_ip: digitalContract.employee_ip_address,
      employer_signed_at: digitalContract.company_signed_at,
      employer_signature_data: digitalContract.company_signature_data ? JSON.parse(digitalContract.company_signature_data) : null,
      created_at: digitalContract.created_at || new Date(),
      updated_at: digitalContract.updated_at || new Date(),
    };
  }
}
