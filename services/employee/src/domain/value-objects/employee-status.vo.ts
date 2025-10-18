export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

export class EmployeeStatusVO {
  constructor(private readonly value: EmployeeStatus) {
    if (!Object.values(EmployeeStatus).includes(value)) {
      throw new Error(`Invalid employee status: ${value}`);
    }
  }

  getValue(): EmployeeStatus {
    return this.value;
  }

  isActive(): boolean {
    return this.value === EmployeeStatus.ACTIVE;
  }

  isTerminated(): boolean {
    return this.value === EmployeeStatus.TERMINATED;
  }

  canAccessSystem(): boolean {
    return this.value === EmployeeStatus.ACTIVE;
  }

  toString(): string {
    return this.value;
  }

  equals(other: EmployeeStatusVO): boolean {
    return this.value === other.value;
  }
}
