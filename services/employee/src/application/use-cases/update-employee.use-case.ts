/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { UpdateEmployeeDto } from '../dto/employee/update-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { EmployeeUpdatedEventDto } from '../dto/employee/employee-updated.event.dto';

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: UpdateEmployeeDto, updatedBy?: number): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findById(id);
    
    if (!existingEmployee) {
      throw new EmployeeNotFoundException(id);
    }

    // Validate business rules
    if (dto.email && dto.email !== existingEmployee.email) {
      const employeeWithEmail = await this.employeeRepository.findByEmail(dto.email);
      if (employeeWithEmail && employeeWithEmail.id !== id) {
        throw new Error('Email already exists for another employee');
      }
    }

    const updateData: Partial<Employee> = {
      updated_by: updatedBy,
    };

    // Copy non-date fields
    if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
    if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.national_id !== undefined) updateData.national_id = dto.national_id;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone_number !== undefined) updateData.phone_number = dto.phone_number;
    if (dto.personal_email !== undefined) updateData.personal_email = dto.personal_email;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.department_id !== undefined) updateData.department_id = dto.department_id;
    if (dto.position_id !== undefined) updateData.position_id = dto.position_id;
    if (dto.manager_id !== undefined) updateData.manager_id = dto.manager_id;
    if (dto.employment_type !== undefined) updateData.employment_type = dto.employment_type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.termination_reason !== undefined) updateData.termination_reason = dto.termination_reason;
    if (dto.emergency_contact !== undefined) updateData.emergency_contact = dto.emergency_contact;
    if (dto.onboarding_status !== undefined) updateData.onboarding_status = dto.onboarding_status;
    if (dto.profile_completion_percentage !== undefined) updateData.profile_completion_percentage = dto.profile_completion_percentage;
    if (dto.external_refs !== undefined) updateData.external_refs = dto.external_refs;

    // Convert date strings to Date objects
    if (dto.date_of_birth) {
      updateData.date_of_birth = new Date(dto.date_of_birth);
    }
    if (dto.hire_date) {
      updateData.hire_date = new Date(dto.hire_date);
    }
    if (dto.termination_date) {
      updateData.termination_date = new Date(dto.termination_date);
    }

    // Update full_name if first_name or last_name changed
    if (dto.first_name || dto.last_name) {
      const firstName = dto.first_name || existingEmployee.first_name;
      const lastName = dto.last_name || existingEmployee.last_name;
      updateData.full_name = `${firstName} ${lastName}`;
    }

    const updatedEmployee = await this.employeeRepository.update(id, updateData);

    // Publish update event
    const eventDto = new EmployeeUpdatedEventDto(updatedEmployee);
    this.eventPublisher.publish('employee_updated', eventDto);

    return updatedEmployee;
  }
}