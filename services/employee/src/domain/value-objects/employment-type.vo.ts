export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  FREELANCE = 'FREELANCE',
}

export class EmploymentTypeVO {
  constructor(private readonly value: EmploymentType) {
    if (!Object.values(EmploymentType).includes(value)) {
      throw new Error(`Invalid employment type: ${value}`);
    }
  }

  getValue(): EmploymentType {
    return this.value;
  }

  isFullTime(): boolean {
    return this.value === EmploymentType.FULL_TIME;
  }

  isPartTime(): boolean {
    return this.value === EmploymentType.PART_TIME;
  }

  isContract(): boolean {
    return this.value === EmploymentType.CONTRACT;
  }

  isIntern(): boolean {
    return this.value === EmploymentType.INTERN;
  }

  getWorkingHoursPerWeek(): number {
    switch (this.value) {
      case EmploymentType.FULL_TIME:
        return 40;
      case EmploymentType.PART_TIME:
        return 20;
      case EmploymentType.CONTRACT:
        return 40;
      case EmploymentType.INTERN:
        return 20;
      case EmploymentType.FREELANCE:
        return 0; // Variable
      default:
        return 0;
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: EmploymentTypeVO): boolean {
    return this.value === other.value;
  }
}
