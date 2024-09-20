import {
    AnyAnalytics,
    createWrapper,
    CreateWrapperSettings,
    resolveWhen,
} from '@segment/analytics-consent-tools'

import {
    getTrustArcGlobal,
    getNormalizedActiveGroupIds,
    getNormalizedCategories,
    coerceConsentModel,
} from './lib/trustarc-api'

export interface TrustArcSettings {
    integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
    disableConsentChangedEvent?: boolean
    /**
     * Override configured consent model
     * - `opt-in` (strict/GDPR) - wait for explicit consent before loading segment and all destinations.
     * - `opt-out`  (default) - load segment and all destinations without waiting for explicit consent.
     */
    consentModel?: () => 'opt-in' | 'opt-out'
    /**
     * Enable debug logging for TrustArc wrapper
     */
    enableDebugLogging?: boolean
}

/**
 *
 * @param analyticsInstance - An analytics instance. Either `window.analytics`, or the instance returned by `new AnalyticsBrowser()` or `AnalyticsBrowser.load({...})`
 * @param settings - Optional settings for configuring your OneTrust wrapper
 */
export const withTrustArc = <Analytics extends AnyAnalytics>(
    analyticsInstance: Analytics,
    settings: TrustArcSettings = {}
): Analytics => {
    return createWrapper<Analytics>({
        // wait for TrustArc global to be available before wrapper is loaded
        shouldLoadWrapper: async () => {
            await resolveWhen(() => {
                return getTrustArcGlobal() !== undefined
            }, 500)
        },
        shouldLoadSegment: async (ctx) => {
            const TrustArc = getTrustArcGlobal()!
            const consentModel = coerceConsentModel(TrustArc.eu.bindMap.behaviorManager);

            if (consentModel === 'opt-out') {
                return ctx.load({
                    consentModel: 'opt-out',
                })
            } else {
                await resolveWhen(() => {
                    return Boolean(getNormalizedActiveGroupIds().length)
                }, 500)
                return ctx.load({ consentModel: 'opt-in' })
            }
        },
        getCategories: () => {
            const results = getNormalizedCategories()
            return results
        },
        registerOnConsentChanged: settings.disableConsentChangedEvent
            ? undefined
            : (setCategories) => {
                window.addEventListener(
                    'message',
                    (e) => {
                        try {
                            const json = e && e.data != '' && JSON.parse(e.data)
                            if (json && json.message == 'submit_preferences') {
                                // Once identified that the user's preferences were changed, take any actions. On this case we reload.
                                const normalizedCategories = getNormalizedCategories()
                                setCategories(normalizedCategories)
                            }
                        } catch (e) {
                            // Message is not from TrustArc
                        }
                    },
                    false
                )
            },
        integrationCategoryMappings: settings.integrationCategoryMappings,
        enableDebugLogging: settings.enableDebugLogging,
    })(analyticsInstance)
}
