import { Employee } from '../../../domain/entities/employee.entity';
import { EmployeeEntity } from '../entities/employee.entity';

export class EmployeeMapper {
  static toDomain(entity: EmployeeEntity): Employee {
    const domain = new Employee();
    Object.assign(domain, entity);
    domain.address = entity.address;
    domain.emergency_contact = entity.emergency_contact;
    domain.external_refs = entity.external_refs;
    return domain;
  }

  static toPersistence(domain: Employee): EmployeeEntity {
    const entity = new EmployeeEntity();
    Object.assign(entity, domain);
    entity.address = domain.address || {};
    entity.emergency_contact = domain.emergency_contact || {};
    entity.external_refs = domain.external_refs || {};
    return entity;
  }
}