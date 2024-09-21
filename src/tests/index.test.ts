import {withTrustArc} from '../'

import {
    AnyAnalytics
} from '@segment/analytics-consent-tools'

describe("withTrustArc", () => {
    test("when", () => {

        const mockAnalytics: AnyAnalytics = {
            addDestinationMiddleware: jest.fn(),
            addSourceMiddleware: jest.fn(),
            track: jest.fn(),
            page: jest.fn(),
            load: jest.fn()
        };

        withTrustArc(mockAnalytics);
    });
});