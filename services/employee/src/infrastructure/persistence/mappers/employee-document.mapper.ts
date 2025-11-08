import { EmployeeDocument } from '../../../domain/entities/employee-document.entity';

export class EmployeeDocumentMapper {
  static toDomain(schema: any): EmployeeDocument {
    return new EmployeeDocument({
      id: schema.id,
      employee_id: schema.employee_id,
      document_type: schema.document_type,
      document_name: schema.document_name,
      file_url: schema.file_url,
      file_size: schema.file_size,
      mime_type: schema.mime_type,
      uploaded_at: schema.created_at,
      uploaded_by: schema.uploaded_by_user_id,
    });
  }

  static toSchema(document: EmployeeDocument): any {
    return {
      id: document.id,
      employee_id: document.employee_id,
      document_type: document.document_type,
      document_name: document.document_name,
      file_url: document.file_url,
      file_size: document.file_size,
      mime_type: document.mime_type,
      created_at: document.uploaded_at || new Date(),
      uploaded_by_user_id: document.uploaded_by,
    };
  }
}
