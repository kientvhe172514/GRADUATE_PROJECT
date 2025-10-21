export class EmployeeNotFoundException extends Error {
  constructor(id: number) {
    super(`Employee with id ${id} not found`);
    this.name = 'EmployeeNotFoundException';
  }
}