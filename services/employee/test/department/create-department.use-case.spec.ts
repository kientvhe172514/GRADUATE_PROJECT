import { Test, TestingModule } from '@nestjs/testing';
import { CreateDepartmentUseCase } from '../../src/application/use-cases/create-department.use-case';
import { DepartmentRepositoryPort } from '../../src/application/ports/department.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Department } from '../../src/domain/entities/department.entity';
import { CreateDepartmentDto } from '../../src/application/dto/department/create-department.dto';
import {
  COMMON_INPUT,
  createCommonSavedDepartment,
  setupMocks,
  expectSuccessResponse,
} from './mock-helpers';

describe('CreateDepartmentUseCase', () => {
  let useCase: CreateDepartmentUseCase;
  let mockDepartmentRepository: jest.Mocked<DepartmentRepositoryPort>;
  let mockEventPublisher: jest.Mocked<EventPublisherPort>;

  beforeEach(async () => {
    // Create mock implementations
    mockDepartmentRepository = {
      create: jest.fn(),
      findByCode: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findWithPagination: jest.fn(),
      getEmployeeCountByDepartment: jest.fn(),
      getEmployeeCountByStatus: jest.fn(),
      getEmployeeCountByPosition: jest.fn(),
      getSubDepartmentsCount: jest.fn(),
      findByManagerId: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDepartmentUseCase,
        {
          provide: DEPARTMENT_REPOSITORY,
          useValue: mockDepartmentRepository,
        },
        {
          provide: EVENT_PUBLISHER,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<CreateDepartmentUseCase>(CreateDepartmentUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to setup mocks with repositories from the test context
  const setupTestMocks = (savedDepartment: Department) => {
    setupMocks(mockDepartmentRepository, mockEventPublisher, savedDepartment);
  };

  describe('execute', () => {
    const validCreateDepartmentDto: CreateDepartmentDto = {
      department_code: COMMON_INPUT.department_code,
      department_name: COMMON_INPUT.department_name,
      description: COMMON_INPUT.description,
      parent_department_id: COMMON_INPUT.parent_department_id,
      manager_id: COMMON_INPUT.manager_id,
      office_address: COMMON_INPUT.office_address,
      office_latitude: COMMON_INPUT.office_latitude,
      office_longitude: COMMON_INPUT.office_longitude,
      office_radius_meters: COMMON_INPUT.office_radius_meters,
    };

    /**
     * TC_001: Create department with all fields
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: validCreateDepartmentDto | Output: EXPECTED_SUCCESS_RESPONSE + event published
     */
    it('TC_001: Create department with all fields', async () => {
      // Arrange
      const savedDepartment = createCommonSavedDepartment();
      setupTestMocks(savedDepartment);

      // Act
      const result = await useCase.execute(validCreateDepartmentDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 1,
          department_code: 'IT-001',
          department_name: 'Information Technology',
          description: 'IT Department',
          level: 1,
          status: 'ACTIVE',
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('department_created', savedDepartment);
    });

    /**
     * TC_002: Throw error when department_code already exists
     * Preconditions: ${PRECONDITIONS_DUPLICATE_CODE}
     * Input: validCreateDepartmentDto | Output: BusinessException 'DEPARTMENT_CODE_ALREADY_EXISTS'
     */
    it('TC_002: Throw error when department_code already exists', async () => {
      // Arrange
      jest.clearAllMocks();

      const existingDepartment = createCommonSavedDepartment({ id: 10 });
      mockDepartmentRepository.findByCode.mockResolvedValue(existingDepartment);

      // Act & Assert
      await expect(useCase.execute(validCreateDepartmentDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(validCreateDepartmentDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.DEPARTMENT_CODE_ALREADY_EXISTS);
        expect((error as BusinessException).message).toBe('Department code already exists');
      }
      expect(mockDepartmentRepository.create).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    /**
     * TC_003: Create department with parent_department_id
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: dtoWithParent | Output: EXPECTED_SUCCESS_RESPONSE with level 2
     */
    it('TC_003: Create department with parent_department_id', async () => {
      // Arrange
      const dtoWithParent: CreateDepartmentDto = {
        ...validCreateDepartmentDto,
        department_code: 'IT-002',
        department_name: 'Software Development',
        parent_department_id: 1,
      };

      const savedDepartment = createCommonSavedDepartment({
        id: 2,
        department_code: 'IT-002',
        department_name: 'Software Development',
        parent_department_id: 1,
        level: 2,
      });

      setupTestMocks(savedDepartment);

      // Act
      const result = await useCase.execute(dtoWithParent);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.parent_department_id).toBe(1);
      expect(result.data?.level).toBe(2);
      expect(mockDepartmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_department_id: 1,
        })
      );
    });

    /**
     * TC_004: Create department with manager_id
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: dtoWithManager | Output: EXPECTED_SUCCESS_RESPONSE with manager_id
     */
    it('TC_004: Create department with manager_id', async () => {
      // Arrange
      const dtoWithManager: CreateDepartmentDto = {
        ...validCreateDepartmentDto,
        manager_id: 100,
      };

      const savedDepartment = createCommonSavedDepartment({ manager_id: 100 });
      setupTestMocks(savedDepartment);

      // Act
      const result = await useCase.execute(dtoWithManager);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.manager_id).toBe(100);
      expect(mockDepartmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          manager_id: 100,
        })
      );
    });

    /**
     * TC_005: Create department with minimal required fields
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: minimalDto (only code and name) | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_005: Create department with minimal required fields', async () => {
      // Arrange
      const minimalDto: CreateDepartmentDto = {
        department_code: 'HR-001',
        department_name: 'Human Resources',
        description: undefined,
        parent_department_id: undefined,
        manager_id: undefined,
        office_address: undefined,
        office_latitude: undefined,
        office_longitude: undefined,
        office_radius_meters: undefined,
      };

      const savedDepartment = createCommonSavedDepartment({
        id: 3,
        department_code: 'HR-001',
        department_name: 'Human Resources',
        description: undefined,
        office_address: undefined,
        office_latitude: undefined,
        office_longitude: undefined,
      });

      setupTestMocks(savedDepartment);

      // Act
      const result = await useCase.execute(minimalDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.department_code).toBe('HR-001');
      expect(result.data?.department_name).toBe('Human Resources');
      expect(result.data?.level).toBe(1);
      expect(result.data?.status).toBe('ACTIVE');
    });

    /**
     * TC_006: Create department with office location details
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: dtoWithLocation | Output: EXPECTED_SUCCESS_RESPONSE with location data
     */
    it('TC_006: Create department with office location details', async () => {
      // Arrange
      const dtoWithLocation: CreateDepartmentDto = {
        ...validCreateDepartmentDto,
        office_address: '123 Tech Street, District 1',
        office_latitude: 10.776889,
        office_longitude: 106.700806,
        office_radius_meters: 200,
      };

      const savedDepartment = createCommonSavedDepartment({
        office_address: '123 Tech Street, District 1',
        office_latitude: 10.776889,
        office_longitude: 106.700806,
        office_radius_meters: 200,
      });

      setupTestMocks(savedDepartment);

      // Act
      const result = await useCase.execute(dtoWithLocation);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.office_address).toBe('123 Tech Street, District 1');
      expect(result.data?.office_latitude).toBe(10.776889);
      expect(result.data?.office_longitude).toBe(106.700806);
      expect(result.data?.office_radius_meters).toBe(200);
    });

    /**
     * TC_007: Handle repository errors gracefully
     * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
     * Input: validCreateDepartmentDto | Output: Database error thrown
     */
    it('TC_007: Handle repository errors gracefully', async () => {
      // Arrange
      jest.clearAllMocks();
      mockDepartmentRepository.findByCode.mockResolvedValue(null);
      mockDepartmentRepository.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validCreateDepartmentDto)).rejects.toThrow('Database error');
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
