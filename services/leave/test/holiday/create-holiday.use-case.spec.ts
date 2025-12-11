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
         * @id CHTC01
         * @description Create PUBLIC_HOLIDAY successfully
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_name:"Lunar New Year", holiday_type:"PUBLIC_HOLIDAY", year:2025}}
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
         * @id CHTC02
         * @description Create COMPANY_HOLIDAY successfully
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_name:"Lunar New Year", holiday_type:"COMPANY_HOLIDAY", year:2025}}
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
         * @id CHTC03
         * @description Create REGIONAL_HOLIDAY successfully
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_name:"Lunar New Year", holiday_type:"REGIONAL_HOLIDAY", year:2025}}
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
         * @id CHTC04
         * @description Create RELIGIOUS_HOLIDAY successfully
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_name:"Lunar New Year", holiday_type:"RELIGIOUS_HOLIDAY", year:2025}}
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
         * @id CHTC05
         * @description Throw error when PUBLIC_HOLIDAY already exists on same date
         * @type A
         * @output "A PUBLIC_HOLIDAY holiday already exists on 2025-01-29. Only one holiday per type per date is allowed."
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
         * @id CHTC06
         * @description Throw error when COMPANY_HOLIDAY already exists on same date
         * @type A
         * @output "A COMPANY_HOLIDAY holiday already exists on 2025-01-29. Only one holiday per type per date is allowed."
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
         * @id CHTC07
         * @description Allow creating different holiday type on same date
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_name:"Lunar New Year", holiday_type:"COMPANY_HOLIDAY", year:2025}}
         */
        it('CHTC07: Allow creating different holiday type on same date', async () => {
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
         * @id CHTC08
         * @description Convert holiday_date string to Date object
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Holiday created successfully", data:{id:1, holiday_date:Date}}
         */
        it('CHTC08: Convert holiday_date string to Date object', async () => {
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
