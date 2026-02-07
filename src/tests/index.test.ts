import {
    testHelpers,
    TrustArcSettings,
    withTrustArc,
} from '../'

import { getTrustArcGlobal } from '../lib/trustarc-api';
import { createWrapper } from '@segment/analytics-consent-tools';



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
                callApi: (_a: string, _b: string) => {
                    return {
                        source: "asserted",
                        consentDecision: [1, 2, 3, 4]
                    }
                }
            }
        };

        const settings: TrustArcSettings = {};
        const categories = testHelpers.getCategories(settings);

        expect(categories).toEqual({ "ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true });
    });

    test("should use consentModelBasedOnConsentExperience when set to true with expressed behavior", () => {
        // Mock the window.truste global variable with expressed consent experience
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "us",
                    categoryCount: 4,
                    domain: "test.com",
                    behavior: "expressed"
                }
            },
            cma: {
                callApi: (_a: string, _b: string) => {
                    return {
                        source: "implied",
                        consentDecision: []
                    }
                }
            }
        };

        const settings: TrustArcSettings = {
            consentModelBasedOnConsentExperience: true
        };
        const categories = testHelpers.getCategories(settings);

        // With expressed behavior and opt-in model, only required category should be true
        expect(categories).toEqual({ "ta-1": true, "ta-2": false, "ta-3": false, "ta-4": false });
    });

    test("should use consentModelBasedOnConsentExperience when set to true with implied behavior", () => {
        // Mock the window.truste global variable with implied consent experience
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com",
                    behavior: "implied"
                }
            },
            cma: {
                callApi: (_a: string, _b: string) => {
                    return {
                        source: "implied",
                        consentDecision: []
                    }
                }
            }
        };

        const settings: TrustArcSettings = {
            consentModelBasedOnConsentExperience: true
        };
        const categories = testHelpers.getCategories(settings);

        // With implied behavior and opt-out model, all categories should be true
        expect(categories).toEqual({ "ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true });
    });

    test("should use custom consentModel function when provided", () => {
        // Mock the window.truste global variable
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "us",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: (_a: string, _b: string) => {
                    return {
                        source: "implied",
                        consentDecision: []
                    }
                }
            }
        };

        const settings: TrustArcSettings = {
            consentModel: () => 'opt-in'
        };
        const categories = testHelpers.getCategories(settings);

        // Custom function returns opt-in, so only required category should be true
        expect(categories).toEqual({ "ta-1": true, "ta-2": false, "ta-3": false, "ta-4": false });
    });

    test("should use custom consentModel function returning opt-out", () => {
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
                callApi: (_a: string, _b: string) => {
                    return {
                        source: "implied",
                        consentDecision: []
                    }
                }
            }
        };

        const settings: TrustArcSettings = {
            consentModel: () => 'opt-out'
        };
        const categories = testHelpers.getCategories(settings);

        // Custom function returns opt-out, so all categories should be true
        expect(categories).toEqual({ "ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true });
    });

    test("should return opt-out categories when location is unprovisioned and considerUnprovisionedLocationsAsOptOut is true", () => {
        // Mock the window.truste global variable with unprovisioned source
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: "unprovisioned",
                    consentDecision: []
                })
            }
        };

        const settings: TrustArcSettings = {
            considerUnprovisionedLocationsAsOptOut: true
        };
        const categories = testHelpers.getCategories(settings);

        // In opt-out mode, all categories should be true by default
        expect(categories).toEqual({ "ta-1": true, "ta-2": true, "ta-3": true, "ta-4": true });
    });

    test("should use normal flow when location is unprovisioned but considerUnprovisionedLocationsAsOptOut is false", () => {
        // Mock the window.truste global variable with unprovisioned source
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: "unprovisioned",
                    consentDecision: []
                })
            }
        };

        const settings: TrustArcSettings = {
            considerUnprovisionedLocationsAsOptOut: false
        };
        const categories = testHelpers.getCategories(settings);

        // Should follow normal opt-in behavior from behaviorManager
        expect(categories).toEqual({ "ta-1": true, "ta-2": false, "ta-3": false, "ta-4": false });
    });

    test("should use normal flow when considerUnprovisionedLocationsAsOptOut is true but source is not unprovisioned", () => {
        // Mock the window.truste global variable with provisioned source
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: "eu",
                    categoryCount: 4,
                    domain: "test.com"
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: "asserted",
                    consentDecision: [1, 2, 3, 4]
                })
            }
        };

        const settings: TrustArcSettings = {
            considerUnprovisionedLocationsAsOptOut: true
        };
        const categories = testHelpers.getCategories(settings);

        // Should follow normal consent behavior
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

    it('should load with opt-out consent model when location is unprovisioned and considerUnprovisionedLocationsAsOptOut is true', async () => {
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
                    source: 'unprovisioned',  // Unprovisioned location
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            considerUnprovisionedLocationsAsOptOut: true
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Should load with opt-out model for unprovisioned locations
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-out',
        });
    });

    it('should load with opt-in consent model when location is unprovisioned but considerUnprovisionedLocationsAsOptOut is false', async () => {
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
                    source: 'unprovisioned',
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            considerUnprovisionedLocationsAsOptOut: false,
            alwaysLoadSegment: true
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Should follow normal opt-in behavior based on behaviorManager
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-in',
        });
    });

    it('should load with opt-out when consentModelBasedOnConsentExperience is true and behavior is implied', async () => {
        const mockTrustArc = {
            eu: {
                bindMap: {
                    behaviorManager: 'eu',
                    categoryCount: 4,
                    domain: 'test.com',
                    behavior: 'implied'
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            consentModelBasedOnConsentExperience: true
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Implied behavior should result in opt-out
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-out',
        });
    });

    it('should load with opt-in when consentModelBasedOnConsentExperience is true and behavior is expressed', async () => {
        const mockTrustArc = {
            eu: {
                bindMap: {
                    behaviorManager: 'us',
                    categoryCount: 4,
                    domain: 'test.com',
                    behavior: 'expressed'
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            consentModelBasedOnConsentExperience: true,
            alwaysLoadSegment: true
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Expressed behavior should result in opt-in
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-in',
        });
    });

    it('should load with opt-out when custom consentModel function returns opt-out', async () => {
        const mockTrustArc = {
            eu: {
                bindMap: {
                    behaviorManager: 'eu',
                    categoryCount: 4,
                    domain: 'test.com',
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            consentModel: () => 'opt-out'
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Custom function returns opt-out
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-out',
        });
    });

    it('should load with opt-in when custom consentModel function returns opt-in', async () => {
        const mockTrustArc = {
            eu: {
                bindMap: {
                    behaviorManager: 'us',
                    categoryCount: 4,
                    domain: 'test.com',
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'implied',
                    consentDecision: [],
                }),
            },
        };

        (getTrustArcGlobal as jest.Mock).mockReturnValue(mockTrustArc);

        const ctx = { load: jest.fn() };
        const settings: TrustArcSettings = {
            consentModel: () => 'opt-in',
            alwaysLoadSegment: true
        };

        await testHelpers.shouldLoadSegment(ctx, settings);

        // Custom function returns opt-in
        expect(ctx.load).toHaveBeenCalledWith({
            consentModel: 'opt-in',
        });
    });
});

// Mock createWrapper
jest.mock('@segment/analytics-consent-tools', () => ({
    createWrapper: jest.fn(),
    resolveWhen: jest.requireActual('@segment/analytics-consent-tools').resolveWhen,
}));

describe('withTrustArc and registerOnConsentChanged', () => {
    let mockAnalytics: any;
    let capturedConfig: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock analytics instance
        mockAnalytics = {
            track: jest.fn(),
            identify: jest.fn(),
        };

        // Mock createWrapper to capture the config and return a function that returns the analytics instance
        (createWrapper as jest.Mock).mockImplementation((config) => {
            capturedConfig = config;
            return (analytics: any) => analytics;
        });

        // Mock TrustArc global
        window.truste = {
            eu: {
                bindMap: {
                    behaviorManager: 'eu',
                    categoryCount: 4,
                    domain: 'test.com',
                }
            },
            cma: {
                callApi: jest.fn().mockReturnValue({
                    source: 'asserted',
                    consentDecision: [1, 2, 3, 4],
                }),
            },
        };
    });

    afterEach(() => {
        window.truste = undefined;
        jest.restoreAllMocks();
    });

    test('should register consent changed event handler when disableConsentChangedEvent is false', () => {
        const settings: TrustArcSettings = {
            disableConsentChangedEvent: false,
        };

        withTrustArc(mockAnalytics, settings);

        expect(createWrapper).toHaveBeenCalled();
        expect(capturedConfig.registerOnConsentChanged).toBeDefined();
        expect(typeof capturedConfig.registerOnConsentChanged).toBe('function');
    });

    test('should not register consent changed event handler when disableConsentChangedEvent is true', () => {
        const settings: TrustArcSettings = {
            disableConsentChangedEvent: true,
        };

        withTrustArc(mockAnalytics, settings);

        expect(createWrapper).toHaveBeenCalled();
        expect(capturedConfig.registerOnConsentChanged).toBeUndefined();
    });

    test('should handle submit_preferences message event', () => {
        const settings: TrustArcSettings = {};
        const mockSetCategories = jest.fn();

        withTrustArc(mockAnalytics, settings);

        // Get the registered callback
        const registerCallback = capturedConfig.registerOnConsentChanged;
        expect(registerCallback).toBeDefined();

        // Call the callback with mockSetCategories
        registerCallback(mockSetCategories);

        // Simulate the message event
        const messageEvent = new MessageEvent('message', {
            data: JSON.stringify({ message: 'submit_preferences' }),
        });

        window.dispatchEvent(messageEvent);

        // Verify setCategories was called with the normalized categories
        expect(mockSetCategories).toHaveBeenCalledWith({
            'ta-1': true,
            'ta-2': true,
            'ta-3': true,
            'ta-4': true,
        });
    });

    test('should ignore non-TrustArc messages', () => {
        const settings: TrustArcSettings = {};
        const mockSetCategories = jest.fn();

        withTrustArc(mockAnalytics, settings);

        // Get the registered callback
        const registerCallback = capturedConfig.registerOnConsentChanged;
        registerCallback(mockSetCategories);

        // Simulate a message event with different content
        const messageEvent = new MessageEvent('message', {
            data: JSON.stringify({ message: 'some_other_message' }),
        });

        window.dispatchEvent(messageEvent);

        // Verify setCategories was NOT called
        expect(mockSetCategories).not.toHaveBeenCalled();
    });

    test('should handle malformed message data', () => {
        const settings: TrustArcSettings = {};
        const mockSetCategories = jest.fn();

        withTrustArc(mockAnalytics, settings);

        // Get the registered callback
        const registerCallback = capturedConfig.registerOnConsentChanged;
        registerCallback(mockSetCategories);

        // Simulate a message event with invalid JSON
        const messageEvent = new MessageEvent('message', {
            data: 'not valid json',
        });

        window.dispatchEvent(messageEvent);

        // Should not throw and setCategories should not be called
        expect(mockSetCategories).not.toHaveBeenCalled();
    });

    test('should handle empty message data', () => {
        const settings: TrustArcSettings = {};
        const mockSetCategories = jest.fn();

        withTrustArc(mockAnalytics, settings);

        // Get the registered callback
        const registerCallback = capturedConfig.registerOnConsentChanged;
        registerCallback(mockSetCategories);

        // Simulate a message event with empty data
        const messageEvent = new MessageEvent('message', {
            data: '',
        });

        window.dispatchEvent(messageEvent);

        // Should not throw and setCategories should not be called
        expect(mockSetCategories).not.toHaveBeenCalled();
    });
});

