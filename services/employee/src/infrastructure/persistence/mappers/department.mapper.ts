import { Department } from '../../../domain/entities/department.entity';

export class DepartmentMapper {
  static toDomain(raw: any): Department {
    return new Department({
      id: raw.id,
      department_code: raw.department_code,
      department_name: raw.department_name,
      description: raw.description,
      parent_department_id: raw.parent_department_id,
      level: raw.level,
      path: raw.path,
      manager_id: raw.manager_id,
      office_address: raw.office_address,
      office_latitude: raw.office_latitude,
      office_longitude: raw.office_longitude,
      office_radius_meters: raw.office_radius_meters,
      status: raw.status,
      created_at: raw.created_at,
      updated_at: raw.updated_at
    });
  }

  static toPersistence(domain: Department): any {
    return {
      id: domain.id,
      department_code: domain.department_code,
      department_name: domain.department_name,
      description: domain.description,
      parent_department_id: domain.parent_department_id,
      level: domain.level,
      path: domain.path,
      manager_id: domain.manager_id,
      office_address: domain.office_address,
      office_latitude: domain.office_latitude,
      office_longitude: domain.office_longitude,
      office_radius_meters: domain.office_radius_meters,
      status: domain.status,
      created_at: domain.created_at,
      updated_at: domain.updated_at
    };
  }
}