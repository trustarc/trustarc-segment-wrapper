import {
    testHelpers,
    TrustArcSettings,
} from '../'

import { getTrustArcGlobal } from '../lib/trustarc-api';



describe("shouldLoadWrapper", () => {
    test("should load when TrustArc Global is available", async () => {

        // Mock the window.truste global variable
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: jest.fn()
            }
        };

        await expect(testHelpers.shouldLoadWrapper()).resolves.not.toThrow(); // Ensure it resolves without throwing
    });
});

describe("getCategories", () => {
    test("when consent model is opt-in and has accepted all categories", () => {

        // Mock the window.truste global variable
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: (a: string, b: string) => {
                    return {
                        source: "asserted",
                        consentDecision: [1, 2, 3, 4]
                    }
                }
            }
        };

        const categories = testHelpers.getCategories();

        expect(categories).toEqual({ "ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true });
    });
});
describe('shouldLoadSegment', () => {

    // Mock inside beforeEach for isolation
    beforeEach(() => {
        jest.spyOn(require('../lib/trustarc-api'), 'getTrustArcGlobal').mockReturnValue({
            eu: {
                bindMap: {
                    behaviorManager: 'eu', // Consent model is opt-in
                    categoryCount: 4,
                    domain: 'test.com',
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',  // Mocking the decision object
                    consentDecision: ['group1', 'group2'],  // Example consent groups
                }),
            },
        });
    });
    // Reset the mock after each test to avoid side effects
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should load with opt-in consent model by default when alwaysLoadSegment is true', async () => {
        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            alwaysLoadSegment: true
        };

        // Call shouldLoadSegment with the mocked TrustArc global
        await testHelpers.shouldLoadSegment(ctx, settings);

        // Assert that the load method was called with the expected consent model
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-in',
        });
    });

    it('It should not resolve when consent model is opt-in and alwaysLoadSegment is not provided', async () => {
        const mockTrustArc = {
            eu: {
                bindMap: {
                    behaviorManager: 'eu', // Consent model is opt-in
                    categoryCount: 4,
                    domain: 'test.com',
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',  // Mocking the decision object
                    consentDecision: ['group1', 'group2'],  // Example consent groups
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings = {};

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout exceeded')), 2000) // Timeout after 2 seconds
        );

        // Since the consent model is opt-in and consent will not be provided, the function will never resolve.
        // Here were testing that it deosnt resolve after 2000 seconds
        await expect(Promise.race([testHelpers.shouldLoadSegment(ctx, settings), timeoutPromise]))
            .rejects.toThrow('Timeout exceeded');

    });
});

