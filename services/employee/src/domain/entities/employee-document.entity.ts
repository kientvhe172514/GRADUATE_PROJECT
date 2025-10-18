export enum DocumentType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DEGREE = 'DEGREE',
  CERTIFICATE = 'CERTIFICATE',
  CONTRACT = 'CONTRACT',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER',
}

export class EmployeeDocument {
  id?: number;
  employee_id: number;
  
  document_type: DocumentType;
  document_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  
  uploaded_at?: Date;
  uploaded_by?: number;

  constructor(data: Partial<EmployeeDocument>) {
    Object.assign(this, data);
    this.uploaded_at = this.uploaded_at || new Date();
  }

  getFileExtension(): string {
    return this.file_url.split('.').pop() || '';
  }

  isImage(): boolean {
    return this.mime_type?.startsWith('image/') || false;
  }

  isPdf(): boolean {
    return this.mime_type === 'application/pdf';
  }

  getFileSizeInMB(): number {
    if (!this.file_size) return 0;
    return this.file_size / (1024 * 1024);
  }
}
