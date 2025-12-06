export interface PermissionRepositoryPort {
  findAll(filters?: {
    resource?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ permissions: any[]; total: number }>;
  findById(id: number): Promise<any | null>;
  findByCode(code: string): Promise<any | null>;
  findByResource(resource: string): Promise<any[]>;
  create(permissionData: any): Promise<any>;
  update(id: number, permissionData: any): Promise<any>;
  delete(id: number): Promise<void>;
}
