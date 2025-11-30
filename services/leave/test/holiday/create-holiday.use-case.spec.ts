import { Test, TestingModule } from '@nestjs/testing';
import { CreateHolidayUseCase } from '../../src/application/holiday/use-cases/create-holiday.use-case';
import { CreateHolidayDto, HolidayType, HolidayAppliesTo } from '../../src/application/holiday/dto/holiday.dto';
import { IHolidayRepository } from '../../src/application/ports/holiday.repository.interface';
import { HOLIDAY_REPOSITORY } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import {
    createMockHoliday,
    setupCreateHolidayMocks,
    expectHolidayCreated,
    expectRepositoryCalls,
    expectHolidayEntityFormat,
    expectDuplicateCheck,
    MockRepositories,
    MOCK_HOLIDAY_DATE,
    PRECONDITIONS_BASIC_CREATE,
    PRECONDITIONS_DUPLICATE_EXISTS,
} from './mock-helpers';

describe('CreateHolidayUseCase', () => {
    let useCase: CreateHolidayUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockHolidayRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByDateRange: jest.fn(),
            findByYear: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        mocks = {
            mockHolidayRepository: mockHolidayRepository as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateHolidayUseCase,
                {
                    provide: HOLIDAY_REPOSITORY,
                    useValue: mockHolidayRepository,
                },
            ],
        }).compile();

        useCase = module.get<CreateHolidayUseCase>(CreateHolidayUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * CHTC01: Create PUBLIC_HOLIDAY successfully
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateHolidayDto with PUBLIC_HOLIDAY type
         * Output: Success response with created holiday
         */
        it('CHTC01: Create PUBLIC_HOLIDAY successfully', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const createdHoliday = createMockHoliday({
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [], createdHoliday);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectHolidayCreated(result, {
                holiday_name: dto.holiday_name,
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
                description: dto.description,
            });
            expectRepositoryCalls(mocks.mockHolidayRepository, MOCK_HOLIDAY_DATE);
            expectHolidayEntityFormat(mocks.mockHolidayRepository);
            expectDuplicateCheck(mocks.mockHolidayRepository, false);
        });

        /**
         * CHTC02: Create COMPANY_HOLIDAY successfully
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateHolidayDto with COMPANY_HOLIDAY type
         * Output: Success response with created holiday
         */
        it('CHTC02: Create COMPANY_HOLIDAY successfully', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.COMPANY_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const createdHoliday = createMockHoliday({
                holiday_type: HolidayType.COMPANY_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [], createdHoliday);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectHolidayCreated(result, {
                holiday_name: dto.holiday_name,
                holiday_type: HolidayType.COMPANY_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
                description: dto.description,
            });
            expectRepositoryCalls(mocks.mockHolidayRepository, MOCK_HOLIDAY_DATE);
        });

        /**
         * CHTC03: Create REGIONAL_HOLIDAY successfully
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateHolidayDto with REGIONAL_HOLIDAY type
         * Output: Success response with created holiday
         */
        it('CHTC03: Create REGIONAL_HOLIDAY successfully', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.REGIONAL_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const createdHoliday = createMockHoliday({
                holiday_type: HolidayType.REGIONAL_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [], createdHoliday);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectHolidayCreated(result, {
                holiday_name: dto.holiday_name,
                holiday_type: HolidayType.REGIONAL_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
                description: dto.description,
            });
            expectRepositoryCalls(mocks.mockHolidayRepository, MOCK_HOLIDAY_DATE);
        });

        /**
         * CHTC04: Create RELIGIOUS_HOLIDAY successfully
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateHolidayDto with RELIGIOUS_HOLIDAY type
         * Output: Success response with created holiday
         */
        it('CHTC04: Create RELIGIOUS_HOLIDAY successfully', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.RELIGIOUS_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const createdHoliday = createMockHoliday({
                holiday_type: HolidayType.RELIGIOUS_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [], createdHoliday);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectHolidayCreated(result, {
                holiday_name: dto.holiday_name,
                holiday_type: HolidayType.RELIGIOUS_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
                description: dto.description,
            });
            expectRepositoryCalls(mocks.mockHolidayRepository, MOCK_HOLIDAY_DATE);
        });

        /**
         * CHTC05: Throw error when PUBLIC_HOLIDAY already exists on same date
         * Preconditions: ${PRECONDITIONS_DUPLICATE_EXISTS}
         * Input: CreateHolidayDto with PUBLIC_HOLIDAY type on date that already has PUBLIC_HOLIDAY
         * Output: BusinessException HOLIDAY_ALREADY_EXISTS
         */
        it('CHTC05: Throw error when PUBLIC_HOLIDAY already exists on same date', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const existingHoliday = createMockHoliday({
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [existingHoliday]);

            // Act & Assert
            await expect(useCase.execute(dto)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.HOLIDAY_ALREADY_EXISTS);
                expect((error as BusinessException).message).toBe(
                    `A ${dto.holiday_type} holiday already exists on ${dto.holiday_date}. Only one holiday per type per date is allowed.`
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expectDuplicateCheck(mocks.mockHolidayRepository, true);
        });

        /**
         * CHTC06: Throw error when COMPANY_HOLIDAY already exists on same date
         * Preconditions: Database connected + Holiday exists on 2025-01-29 with type COMPANY_HOLIDAY
         * Input: CreateHolidayDto with COMPANY_HOLIDAY type on date that already has COMPANY_HOLIDAY
         * Output: BusinessException HOLIDAY_ALREADY_EXISTS
         */
        it('CHTC06: Throw error when COMPANY_HOLIDAY already exists on same date', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.COMPANY_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            const existingHoliday = createMockHoliday({
                holiday_type: HolidayType.COMPANY_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [existingHoliday]);

            // Act & Assert
            await expect(useCase.execute(dto)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.HOLIDAY_ALREADY_EXISTS);
                expect((error as BusinessException).message).toBe(
                    `A ${dto.holiday_type} holiday already exists on ${dto.holiday_date}. Only one holiday per type per date is allowed.`
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expectDuplicateCheck(mocks.mockHolidayRepository, true);
        });

        /**
         * Additional test: Allow multiple holidays on same date if different types
         */
        it('Should allow creating different holiday type on same date', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.COMPANY_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                description: 'National holiday celebrating Lunar New Year',
                year: 2025,
            };

            // Existing holiday is PUBLIC_HOLIDAY, new one is COMPANY_HOLIDAY
            const existingHoliday = createMockHoliday({
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
            });

            const createdHoliday = createMockHoliday({
                holiday_type: HolidayType.COMPANY_HOLIDAY,
            });

            setupCreateHolidayMocks(mocks, [existingHoliday], createdHoliday);

            // Act
            const result = await useCase.execute(dto);

            // Assert
            expectHolidayCreated(result, {
                holiday_name: dto.holiday_name,
                holiday_type: HolidayType.COMPANY_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
            });
            expect(mocks.mockHolidayRepository.create).toHaveBeenCalled();
        });

        /**
         * Additional test: Verify date conversion to Date object
         */
        it('Should convert holiday_date string to Date object', async () => {
            // Arrange
            const dto: CreateHolidayDto = {
                holiday_name: 'Lunar New Year',
                holiday_date: MOCK_HOLIDAY_DATE,
                holiday_type: HolidayType.PUBLIC_HOLIDAY,
                applies_to: HolidayAppliesTo.ALL,
                is_recurring: false,
                is_mandatory: true,
                is_paid: true,
                can_work_for_ot: false,
                year: 2025,
            };

            setupCreateHolidayMocks(mocks, []);

            // Act
            await useCase.execute(dto);

            // Assert
            expect(mocks.mockHolidayRepository.create).toHaveBeenCalled();
            const createCall = mocks.mockHolidayRepository.create.mock.calls[0][0];
            expect(createCall.holiday_date).toBeInstanceOf(Date);
        });
    });
});
