import { EntitySchema } from 'typeorm';

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  
  // Document classification
  document_type: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'DEGREE' | 'CERTIFICATE' | 'RESUME' | 'PHOTO' | 'BANK_INFO' | 'TAX_CODE' | 'INSURANCE_CARD' | 'OTHER';
  document_category: string | null;
  document_name: string;
  description: string | null;
  
  // File information
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  
  // Document details
  issue_date: Date | null;
  expiry_date: Date | null;
  issuer: string | null;
  document_number: string | null;
  
  // Verification status
  is_verified: boolean;
  verified_at: Date | null;
  verified_by_user_id: number | null;
  verification_notes: string | null;
  
  // Access control
  is_confidential: boolean;
  access_level: string | null;
  
  // Metadata
  tags: string[] | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  
  uploaded_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}

export const EmployeeDocumentSchema = new EntitySchema<EmployeeDocument>({
  name: 'EmployeeDocument',
  tableName: 'employee_documents',
  columns: {
    id: {
      type: 'bigint',
      primary: true,
      generated: 'increment',
    },
    employee_id: {
      type: 'bigint',
      comment: 'References employees.id',
    },
    document_type: {
      type: 'varchar',
      length: 100,
      comment: 'ID_CARD, PASSPORT, DRIVER_LICENSE, DEGREE, CERTIFICATE, RESUME, PHOTO, BANK_INFO, TAX_CODE, INSURANCE_CARD, OTHER',
    },
    document_category: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Sub-category: EDUCATION, IDENTIFICATION, FINANCIAL, CERTIFICATION, etc.',
    },
    document_name: {
      type: 'varchar',
      length: 255,
      comment: 'Tên tài liệu, VD: "Bằng Đại Học Bách Khoa 2020"',
    },
    description: {
      type: 'text',
      nullable: true,
      comment: 'Mô tả chi tiết tài liệu',
    },
    file_url: {
      type: 'varchar',
      length: 500,
      comment: 'URL to file in storage (S3/Azure Blob)',
    },
    file_name: {
      type: 'varchar',
      length: 255,
      comment: 'Original file name',
    },
    file_size: {
      type: 'bigint',
      comment: 'File size in bytes',
    },
    mime_type: {
      type: 'varchar',
      length: 100,
      comment: 'application/pdf, image/jpeg, image/png, etc.',
    },
    issue_date: {
      type: 'date',
      nullable: true,
      comment: 'Ngày cấp (cho CMND, bằng cấp, chứng chỉ)',
    },
    expiry_date: {
      type: 'date',
      nullable: true,
      comment: 'Ngày hết hạn (cho CMND, passport, chứng chỉ)',
    },
    issuer: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Nơi cấp, VD: "Công An TP.HCM", "Đại Học Bách Khoa"',
    },
    document_number: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Số CMND, số passport, số bằng cấp',
    },
    is_verified: {
      type: 'boolean',
      default: false,
      comment: 'HR đã xác thực tài liệu chưa',
    },
    verified_at: {
      type: 'timestamp',
      nullable: true,
      comment: 'Thời điểm xác thực',
    },
    verified_by_user_id: {
      type: 'bigint',
      nullable: true,
      comment: 'User ID của HR xác thực',
    },
    verification_notes: {
      type: 'text',
      nullable: true,
      comment: 'Ghi chú khi xác thực (OK, có sai sót, cần bổ sung...)',
    },
    is_confidential: {
      type: 'boolean',
      default: false,
      comment: 'Tài liệu mật (chỉ HR cấp cao xem được)',
    },
    access_level: {
      type: 'varchar',
      length: 50,
      nullable: true,
      comment: 'PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED',
    },
    tags: {
      type: 'jsonb',
      nullable: true,
      comment: 'Tags for search: ["onboarding", "2024", "degree"]',
    },
    notes: {
      type: 'text',
      nullable: true,
      comment: 'Ghi chú thêm',
    },
    metadata: {
      type: 'jsonb',
      nullable: true,
      comment: 'Additional metadata',
    },
    uploaded_by_user_id: {
      type: 'bigint',
      comment: 'User ID người upload',
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  indices: [
    {
      name: 'idx_employee_documents_employee_id',
      columns: ['employee_id'],
    },
    {
      name: 'idx_employee_documents_document_type',
      columns: ['document_type'],
    },
    {
      name: 'idx_employee_documents_is_verified',
      columns: ['is_verified'],
    },
    {
      name: 'idx_employee_documents_expiry_date',
      columns: ['expiry_date'],
    },
    {
      name: 'idx_employee_documents_document_number',
      columns: ['document_number'],
    },
    {
      name: 'idx_employee_documents_created_at',
      columns: ['created_at'],
    },
  ],
});
