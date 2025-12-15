import { Test, TestingModule } from '@nestjs/testing';
import { CreateEmployeeUseCase } from '../../src/application/use-cases/create-employee.use-case';
import { EmployeeRepositoryPort } from '../../src/application/ports/employee.repository.port';
import { PositionRepositoryPort } from '../../src/application/ports/position.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Employee } from '../../src/domain/entities/employee.entity';
import { CreateEmployeeDto } from '../../src/application/dto/employee/create-employee.dto';
import {
  COMMON_POSITION,
  EXPECTED_SUCCESS_RESPONSE,
  createCommonSavedEmployee,
  expectSuccessResponse,
} from './mock-helpers';

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
  let mockEmployeeRepository: jest.Mocked<EmployeeRepositoryPort>;
  let mockPositionRepository: jest.Mocked<PositionRepositoryPort>;
  let mockEventPublisher: jest.Mocked<EventPublisherPort>;

  beforeEach(async () => {
    // Create mock implementations
    mockEmployeeRepository = {
      create: jest.fn(),
      findByCode: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findWithPagination: jest.fn(),
      update: jest.fn(),
      updateAccountId: jest.fn(),
      updateOnboardingStatus: jest.fn(),
    };

    mockPositionRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findWithPagination: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEmployeeUseCase,
        {
          provide: EMPLOYEE_REPOSITORY,
          useValue: mockEmployeeRepository,
        },
        {
          provide: POSITION_REPOSITORY,
          useValue: mockPositionRepository,
        },
        {
          provide: EVENT_PUBLISHER,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<CreateEmployeeUseCase>(CreateEmployeeUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to setup mocks with repositories from the test context
  const setupTestMocks = (savedEmployee: Employee, position: any = null) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup employee repository mocks
    mockEmployeeRepository.findByCode.mockResolvedValue(null);
    mockEmployeeRepository.findByEmail.mockResolvedValue(null);
    mockEmployeeRepository.create.mockResolvedValue(savedEmployee);

    // Setup position repository mock
    mockPositionRepository.findById.mockResolvedValue(position);

    // Setup event publisher mock
    mockEventPublisher.publish.mockImplementation(() => { });
  };


  describe('execute', () => {
    const validCreateEmployeeDto: CreateEmployeeDto = {
      employee_code: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      gender: 'MALE',
      email: 'john.doe@company.com',
      phone_number: '   ',
      department_id: 1,
      position_id: 1,
      manager_id: 2,
      hire_date: '2025-10-07',
      employment_type: 'FULL_TIME',
    };

    /**
     * @id CETCI01
     * @description Create employee with all fields
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", first_name:"John", last_name:"Doe", full_name:"John Doe", date_of_birth:"1990-01-01", gender:"MALE", email:"john.doe@company.com", phone_number:"   ", department_id:1, position_id:1, manager_id:2, hire_date:"2025-10-07", employment_type:"FULL_TIME", status:"ACTIVE", onboarding_status:"PENDING", profile_completion_percentage:0, created_at:"2025-11-09T10:00:00Z", updated_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI01: Create employee with all fields', async () => {
      // Arrange
      const savedEmployee = createCommonSavedEmployee();
      setupTestMocks(savedEmployee, COMMON_POSITION);

      // Act
      const result = await useCase.execute(validCreateEmployeeDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data).toEqual({
        id: 1,
        account_id: 100,
        employee_code: 'EMP001',
        full_name: 'John Doe',
        email: 'john.doe@company.com',
        hire_date: savedEmployee.hire_date,
        onboarding_status: 'PENDING',
        created_at: savedEmployee.created_at,
      });
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    /**
     * @id CETCI02
     * @description Create employee with position but no suggested_role
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}, event:{suggested_role:"EMPLOYEE"}}
     */
    it('CETCI02: Create employee with position but no suggested_role', async () => {
      // Arrange
      const savedEmployee = createCommonSavedEmployee();

      const mockPositionWithoutRole = {
        id: 1,
        position_code: 'POS001',
        position_name: 'Software Engineer',
        level: 2,
        currency: 'VND',
        status: 'ACTIVE',
        // No suggested_role
      };

      setupTestMocks(savedEmployee, mockPositionWithoutRole);

      // Act
      const result = await useCase.execute(validCreateEmployeeDto);

      // Assert
      expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'employee_created',
        expect.objectContaining({
          suggested_role: 'EMPLOYEE', // Default role
        })
      );
    });

    /**
     * @id CETCI03
     * @description Create employee without optional fields
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z", phone_number:undefined, department_id:undefined, position_id:undefined, manager_id:undefined}}
     */
    it('CETCI03: Create employee without optional fields', async () => {
      // Arrange
      const dtoWithoutOptionalFields: CreateEmployeeDto = {
        employee_code: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
        gender: 'MALE',
        email: 'john.doe@company.com',
        hire_date: '2025-10-07',
        employment_type: 'FULL_TIME',
        phone_number: undefined,
        department_id: undefined,
        position_id: undefined,
        manager_id: undefined,
      };

      const savedEmployee = createCommonSavedEmployee({
        phone_number: undefined,
        department_id: undefined,
        position_id: undefined,
        manager_id: undefined,
      });

      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithoutOptionalFields);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.id).toBe(1);
      expect(result.data?.full_name).toBe('John Doe');
    });

    /**
     * @id CETCI04
     * @description Throw error when employee_code already exists
     * @type A
     * @output "Employee code already exists"
     */
    it('CETCI04: Throw error when employee_code already exists', async () => {
      // Arrange
      jest.clearAllMocks();

      const existingEmployee: Employee = {
        id: 10,
        employee_code: validCreateEmployeeDto.employee_code!,
        first_name: 'Existing',
        last_name: 'Employee',
        full_name: 'Existing Employee',
        date_of_birth: new Date('1990-01-01'),
        gender: 'MALE',
        email: 'existing@company.com',
        hire_date: new Date('2025-01-01'),
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        onboarding_status: 'COMPLETED',
        profile_completion_percentage: 100,
      };

      mockEmployeeRepository.findByCode.mockResolvedValue(existingEmployee);

      // Act & Assert
      await expect(useCase.execute(validCreateEmployeeDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(validCreateEmployeeDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS);
        expect((error as BusinessException).message).toBe('Employee code already exists');
      }
    });

    /**
     * @id CETCI05
     * @description Throw error when email already exists
     * @type A
     * @output "Employee email already exists"
     */
    it('CETCI05: Throw error when email already exists', async () => {
      // Arrange
      jest.clearAllMocks();

      const existingEmployee: Employee = {
        id: 20,
        employee_code: 'EMP999',
        first_name: 'Existing',
        last_name: 'User',
        full_name: 'Existing User',
        date_of_birth: new Date('1988-06-20'),
        gender: 'FEMALE',
        email: validCreateEmployeeDto.email,
        hire_date: new Date('2024-01-01'),
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        onboarding_status: 'COMPLETED',
        profile_completion_percentage: 100,
      };

      mockEmployeeRepository.findByCode.mockResolvedValue(null);
      mockEmployeeRepository.findByEmail.mockResolvedValue(existingEmployee);

      // Act & Assert
      await expect(useCase.execute(validCreateEmployeeDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(validCreateEmployeeDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS);
        expect((error as BusinessException).message).toBe('Employee email already exists');
      }
    });

    /**
     * @id CETCI06
     * @description Handle special characters in name (Unicode support)
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"Nguyễn Văn Thành", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI06: Handle special characters in name', async () => {
      // Arrange
      const dtoWithSpecialChars: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        first_name: 'Nguyễn',
        last_name: 'Văn Thành',
      };

      const savedEmployee = createCommonSavedEmployee({
        first_name: 'Nguyễn',
        last_name: 'Văn Thành',
        full_name: 'Nguyễn Văn Thành',
      });

      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithSpecialChars);

      // Assert
      expect(result.data?.full_name).toBe('Nguyễn Văn Thành');
    });

    /**
     * @id CETCI07
     * @description Handle CONTRACT employment type
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z", employment_type:"CONTRACT"}}
     */
    it('CETCI07: Handle CONTRACT employment type', async () => {
      // Arrange
      const dtoWithContractType: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        employment_type: 'CONTRACT',
      };

      const savedEmployee = createCommonSavedEmployee({ employment_type: 'CONTRACT' });

      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithContractType);

      // Assert
      expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      expect(createdEmployee.employment_type).toBe('CONTRACT');
    });

    /**
     * @id CETCI08
     * @description Handle OTHER gender
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z", gender:"OTHER"}}
     */
    it('CETCI08: Handle OTHER gender', async () => {
      // Arrange
      const dtoWithOtherGender: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        gender: 'OTHER',
      };

      const savedEmployee = createCommonSavedEmployee({ gender: 'OTHER' });

      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithOtherGender);

      // Assert
      expectSuccessResponse(result);
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      expect(createdEmployee.gender).toBe('OTHER');
    });

    /**
     * @id CETCI09
     * @description Verify full_name concatenation logic
     * @type B
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"Alexander Montgomery-Williams", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI09: Verify full_name concatenation', async () => {
      // Arrange
      const dtoWithLongNames: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        first_name: 'Alexander',
        last_name: 'Montgomery-Williams',
      };

      const savedEmployee = createCommonSavedEmployee({
        first_name: 'Alexander',
        last_name: 'Montgomery-Williams',
        full_name: 'Alexander Montgomery-Williams',
      });

      setupTestMocks(savedEmployee);

      // Act
      await useCase.execute(dtoWithLongNames);

      // Assert
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      expect(createdEmployee.full_name).toBe('Alexander Montgomery-Williams');
      expect(createdEmployee.full_name).toBe(`${dtoWithLongNames.first_name} ${dtoWithLongNames.last_name}`);
    });

    /**
     * @id CETCI10
     * @description Handle employee without account_id (not yet linked to account)
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:undefined, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI10: Handle employee without account_id', async () => {
      // Arrange
      const savedEmployeeWithoutAccountId = createCommonSavedEmployee({ account_id: undefined });

      setupTestMocks(savedEmployeeWithoutAccountId);

      // Act
      const result = await useCase.execute(validCreateEmployeeDto);

      // Assert
      expect(result.data?.account_id).toBeUndefined();
      expect(result.data?.id).toBe(1);
    });

    /**
     * @id CETCI11
     * @description Throw error when email format is invalid
     * @type A
     * @output "Invalid email format"
     */
    it('CETCI11: Throw error when email format is invalid', async () => {
      // Arrange
      jest.clearAllMocks();

      const dtoWithInvalidEmail: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        email: 'invalid-email-format',
      };

      // Act & Assert
      await expect(useCase.execute(dtoWithInvalidEmail)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(dtoWithInvalidEmail);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe('INVALID_EMAIL_FORMAT');
        expect((error as BusinessException).message).toBe('Invalid email format');
        expect((error as BusinessException).statusCode).toBe(400);
      }

      // Should not reach repository calls
      expect(mockEmployeeRepository.findByCode).not.toHaveBeenCalled();
      expect(mockEmployeeRepository.create).not.toHaveBeenCalled();
    });

    /**
     * @id CETCI12
     * @description Throw error when phone number is not 10 digits
     * @type A
     * @output "Phone number must be exactly 10 digits"
     */
    it('CETCI12: Throw error when phone number is not 10 digits', async () => {
      // Arrange
      jest.clearAllMocks();

      const dtoWithInvalidPhone: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        phone_number: '123456789', // Only 9 digits
      };

      // Act & Assert
      await expect(useCase.execute(dtoWithInvalidPhone)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(dtoWithInvalidPhone);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe('INVALID_PHONE_NUMBER');
        expect((error as BusinessException).message).toBe('Phone number must be exactly 10 digits');
        expect((error as BusinessException).statusCode).toBe(400);
      }

      expect(mockEmployeeRepository.create).not.toHaveBeenCalled();
    });

    /**
     * @id CETCI13
     * @description Throw error when phone number contains non-digits
     * @type A
     * @output "Phone number must be exactly 10 digits"
     */
    it('CETCI13: Throw error when phone number contains non-digits', async () => {
      // Arrange
      jest.clearAllMocks();

      const dtoWithInvalidPhone: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        phone_number: '09123456ab',
      };

      // Act & Assert
      await expect(useCase.execute(dtoWithInvalidPhone)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(dtoWithInvalidPhone);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe('INVALID_PHONE_NUMBER');
        expect((error as BusinessException).message).toBe('Phone number must be exactly 10 digits');
      }
    });

    /**
     * @id CETCI14
     * @description Accept valid 10-digit phone number
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z", phone_number:"0912345678"}}
     */
    it('CETCI14: Accept valid 10-digit phone number', async () => {
      // Arrange
      const dtoWithValidPhone: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        phone_number: '0912345678',
      };

      const savedEmployee = createCommonSavedEmployee({ phone_number: '0912345678' });
      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithValidPhone);

      // Assert
      expectSuccessResponse(result);
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      expect(createdEmployee.phone_number).toBe('0912345678');
    });

    /**
     * @id CETCI15
     * @description Accept various valid email formats
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMP001", full_name:"John Doe", email:"test.user+tag@company.co.uk", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI15: Accept various valid email formats', async () => {
      // Arrange
      const dtoWithValidEmail: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        email: 'test.user+tag@company.co.uk',
      };

      const savedEmployee = createCommonSavedEmployee({ email: 'test.user+tag@company.co.uk' });
      setupTestMocks(savedEmployee);

      // Act
      const result = await useCase.execute(dtoWithValidEmail);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.email).toBe('test.user+tag@company.co.uk');
    });

    /**
     * @id CETCI16
     * @description Throw error when personal_email format is invalid
     * @type A
     * @output "Invalid personal email format"
     */
    it('CETCI16: Throw error when personal_email format is invalid', async () => {
      // Arrange
      jest.clearAllMocks();

      const dtoWithInvalidPersonalEmail: CreateEmployeeDto = {
        ...validCreateEmployeeDto,
        personal_email: 'invalid-personal-email',
      };

      // Act & Assert
      await expect(useCase.execute(dtoWithInvalidPersonalEmail)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(dtoWithInvalidPersonalEmail);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe('INVALID_EMAIL_FORMAT');
        expect((error as BusinessException).message).toBe('Invalid personal email format');
      }
    });

    /**
     * @id CETCI17
     * @description Auto-generate employee_code when not provided (First of the day)
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMPxxxxxxxx001", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI17: Auto-generate employee_code when not provided (First of the day)', async () => {
      // Arrange
      const dtoWithoutCode = { ...validCreateEmployeeDto };
      delete (dtoWithoutCode as any).employee_code;

      const savedEmployee = createCommonSavedEmployee();
      setupTestMocks(savedEmployee);

      // Mock findAll to return empty list (no existing codes)
      mockEmployeeRepository.findAll.mockResolvedValue([]);

      // Mock create to return employee with generated code
      mockEmployeeRepository.create.mockImplementation(async (emp) => {
        const saved = { ...emp, id: 1, created_at: new Date() };
        return saved as Employee;
      });

      // Act
      const result = await useCase.execute(dtoWithoutCode as CreateEmployeeDto);

      // Assert
      expectSuccessResponse(result);
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      expect(createdEmployee.employee_code).toMatch(/^EMP\d{8}001$/);
      expect(result.data?.employee_code).toMatch(/^EMP\d{8}001$/);
    });

    /**
     * @id CETCI18
     * @description Auto-generate employee_code with incrementing sequence
     * @type N
     * @output {status:"SUCCESS", statusCode:201, message:"Employee created", errorCode:"EMPLOYEE_CREATED", data:{id:1, account_id:100, employee_code:"EMPxxxxxxxx006", full_name:"John Doe", email:"john.doe@company.com", hire_date:"2025-10-07", onboarding_status:"PENDING", created_at:"2025-11-09T10:00:00Z"}}
     */
    it('CETCI18: Auto-generate employee_code with incrementing sequence', async () => {
      // Arrange
      const dtoWithoutCode = { ...validCreateEmployeeDto };
      delete (dtoWithoutCode as any).employee_code;

      const savedEmployee = createCommonSavedEmployee();
      setupTestMocks(savedEmployee);

      // Mock date to be fixed so we can construct matching existing codes
      const mockDate = new Date('2025-12-04T10:00:00Z');
      jest.useFakeTimers().setSystemTime(mockDate);

      const datePrefix = '20251204'; // YYYYMMDD for the mock date

      const existingEmployees = [
        { employee_code: `EMP${datePrefix}001` },
        { employee_code: `EMP${datePrefix}002` },
        { employee_code: `EMP${datePrefix}005` }, // Gap in sequence
        { employee_code: `EMP${datePrefix}INVALID` }, // Invalid format to cover branch
      ] as Employee[];

      mockEmployeeRepository.findAll.mockResolvedValue(existingEmployees);

      mockEmployeeRepository.create.mockImplementation(async (emp) => {
        const saved = { ...emp, id: 1, created_at: new Date() };
        return saved as Employee;
      });

      // Act
      const result = await useCase.execute(dtoWithoutCode as CreateEmployeeDto);

      // Assert
      expectSuccessResponse(result);
      const createdEmployee = mockEmployeeRepository.create.mock.calls[0][0];
      // Should be max(1, 2, 5) + 1 = 6 => 006
      expect(createdEmployee.employee_code).toBe(`EMP${datePrefix}006`);

      // Cleanup
      jest.useRealTimers();
    });
  });
});
