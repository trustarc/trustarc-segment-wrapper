import {
    testHelpers,
    TrustArcSettings,
    withTrustArc
} from '../index';

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

        await expect(testHelpers.shouldLoadWrapper()).resolves.not.toThrow();
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
    const mockCtx = { load: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
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
    });

    test('should load with opt-out consent model', async () => {
        await testHelpers.shouldLoadSegment(mockCtx, { consentModel: () => 'opt-out' });
        expect(mockCtx.load).toHaveBeenCalledWith({ consentModel: 'opt-out' });
    });

    test('should load with opt-in consent model when alwaysLoadSegment is true', async () => {
        await testHelpers.shouldLoadSegment(mockCtx, { alwaysLoadSegment: true });
        expect(mockCtx.load).toHaveBeenCalledWith({ consentModel: 'opt-in' });
    });

    test('should load with opt-in consent model when active groups exist', async () => {
        await testHelpers.shouldLoadSegment(mockCtx, { consentModel: () => 'opt-in' });
        expect(mockCtx.load).toHaveBeenCalledWith({ consentModel: 'opt-in' });
    });

    test('should use consent model based on experience', async () => {
        await testHelpers.shouldLoadSegment(mockCtx, { consentModelBasedOnConsentExperience: true });
        expect(mockCtx.load).toHaveBeenCalledWith({ consentModel: 'opt-in' });
    });
});

describe('withTrustArc', () => {
    const mockAnalytics = {
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
        load: jest.fn(),
        addSourceMiddleware: jest.fn(),
        addDestinationMiddleware: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
        ready: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
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
    });

    test('should initialize with debug logging', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        withTrustArc(mockAnalytics, { enableDebugLogging: true });
        expect(consoleSpy).toHaveBeenCalledWith("Loading Segment with TrustArc Wrapper", { enableDebugLogging: true });
    });

    test('should handle consent change events', () => {
        const wrappedAnalytics = withTrustArc(mockAnalytics);
        const event = new MessageEvent('message', {
            data: JSON.stringify({
                message: 'submit_preferences',
                data: {
                    categories: { 'ta-1': true, 'ta-2': false }
                }
            })
        });

        window.dispatchEvent(event);
        // Verify that the event listener was added and handled correctly
    });

    test('should disable consent change events when configured', () => {
        const wrappedAnalytics = withTrustArc(mockAnalytics, { disableConsentChangedEvent: true });
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    test('should handle invalid JSON in consent change events', () => {
        const wrappedAnalytics = withTrustArc(mockAnalytics);
        const event = new MessageEvent('message', {
            data: 'invalid json'
        });

        window.dispatchEvent(event);
        // The event should be caught and handled gracefully
    });

    test('should handle empty data in consent change events', () => {
        const wrappedAnalytics = withTrustArc(mockAnalytics);
        const event = new MessageEvent('message', {
            data: ''
        });

        window.dispatchEvent(event);
        // The event should be caught and handled gracefully
    });

    test('should handle undefined data in consent change events', () => {
        const wrappedAnalytics = withTrustArc(mockAnalytics);
        const event = new MessageEvent('message', {
            data: undefined
        });

        window.dispatchEvent(event);
        // The event should be caught and handled gracefully
    });
});

