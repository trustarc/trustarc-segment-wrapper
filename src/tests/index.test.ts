import {
    testHelpers,
} from '../'


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
    test("when consent model is opt-in and has accepted all categories",  () => {

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
        
        expect(categories).toEqual({"ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true});
    });
});