export interface RoleRepositoryPort {
  getPermissionsByRoleCode(roleCode: string): Promise<string[]>;
  findByCode(code: string): Promise<any | null>;
  findAll(filters?: { status?: string; page?: number; limit?: number }): Promise<{ roles: any[]; total: number }>;
  findById(id: number): Promise<any | null>;
  findByIdWithPermissions(id: number): Promise<any | null>;
  create(roleData: any): Promise<any>;
  update(id: number, roleData: any): Promise<any>;
  delete(id: number): Promise<void>;
  assignPermissions(roleId: number, permissionIds: number[]): Promise<void>;
  removePermission(roleId: number, permissionId: number): Promise<void>;
  getRolePermissions(roleId: number): Promise<any[]>;
}