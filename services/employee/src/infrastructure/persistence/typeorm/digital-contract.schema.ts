import { EntitySchema } from 'typeorm';

export interface DigitalContract {
  id: number;
  contract_id: number;
  
  // File information
  file_url: string;
  file_name: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  
  // Version control
  version: number;
  is_final: boolean;
  previous_version_id: number | null;
  
  // Digital signature tracking
  employee_signed_at: Date | null;
  employer_signed_at: Date | null;
  employee_signature_ip: string | null;
  employer_signature_ip: string | null;
  employee_signature_data: Record<string, any> | null;
  employer_signature_data: Record<string, any> | null;
  
  // Verification
  verification_code: string | null;
  verified_at: Date | null;
  
  // Metadata
  upload_source: string | null;
  metadata: Record<string, any> | null;
  
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number | null;
}

export const DigitalContractSchema = new EntitySchema<DigitalContract>({
  name: 'DigitalContract',
  tableName: 'digital_contracts',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: 'increment',
    },
    contract_id: {
      type: 'bigint',
      comment: 'References contracts.id',
    },
    file_url: {
      type: 'varchar',
      length: 500,
      comment: 'URL to PDF file in S3/Azure Blob Storage',
    },
    file_name: {
      type: 'varchar',
      length: 255,
      comment: 'Original file name',
    },
    file_hash: {
      type: 'varchar',
      length: 64,
      comment: 'SHA256 hash for file integrity verification',
    },
    file_size: {
      type: 'bigint',
      comment: 'File size in bytes',
    },
    mime_type: {
      type: 'varchar',
      length: 100,
      comment: 'application/pdf, image/png, etc.',
    },
    version: {
      type: 'int',
      default: 1,
      comment: 'Version number (1, 2, 3...)',
    },
    is_final: {
      type: 'boolean',
      default: false,
      comment: 'Đã ký xong cả 2 bên = true',
    },
    previous_version_id: {
      type: 'bigint',
      nullable: true,
      comment: 'Link to previous version for audit trail',
    },
    employee_signed_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Thời điểm nhân viên ký',
    },
    employer_signed_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Thời điểm công ty ký',
    },
    employee_signature_ip: {
      type: 'varchar',
      length: 45,
      nullable: true,
      comment: 'IP address nhân viên khi ký',
    },
    employer_signature_ip: {
      type: 'varchar',
      length: 45,
      nullable: true,
      comment: 'IP address HR/Manager khi ký',
    },
    employee_signature_data: {
      type: 'jsonb',
      nullable: true,
      comment: 'Signature metadata: {method: "digital", device: "mobile", location: {lat, lng}}',
    },
    employer_signature_data: {
      type: 'jsonb',
      nullable: true,
      comment: 'Signature metadata from company side',
    },
    verification_code: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Mã xác thực hợp đồng số',
    },
    verified_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Thời điểm xác thực',
    },
    upload_source: {
      type: 'varchar',
      length: 50,
      nullable: true,
      comment: 'WEB, MOBILE, EMAIL, API',
    },
    metadata: {
      type: 'jsonb',
      nullable: true,
      comment: 'Additional metadata',
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    created_by_user_id: {
      type: 'bigint',
      nullable: true,
      comment: 'User ID người upload',
    },
  },
  indices: [
    {
      name: 'idx_digital_contracts_contract_id',
      columns: ['contract_id'],
    },
    {
      name: 'idx_digital_contracts_file_hash',
      columns: ['file_hash'],
    },
    {
      name: 'idx_digital_contracts_version',
      columns: ['contract_id', 'version'],
    },
    {
      name: 'idx_digital_contracts_is_final',
      columns: ['is_final'],
    },
    {
      name: 'idx_digital_contracts_signatures',
      columns: ['employee_signed_at', 'employer_signed_at'],
    },
  ],
});
