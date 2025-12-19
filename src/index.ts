import {
    AnyAnalytics,
    createWrapper,
    resolveWhen,
} from '@segment/analytics-consent-tools'

import {
    getTrustArcGlobal,
    getNormalizedActiveGroupIds,
    getNormalizedCategories,
    coerceConsentModel,
    getConsentExperience,
} from './lib/trustarc-api'

import { log } from './lib/logger'

export interface TrustArcSettings {
    disableConsentChangedEvent?: boolean
    /**
     * Override configured consent model
     * - `opt-in` (strict/GDPR) - wait for explicit consent before loading segment and all destinations.
     * - `opt-out`  (default) - load segment and all destinations without waiting for explicit consent.
     */
    consentModel?: () => 'opt-in' | 'opt-out'

    /**
     * When this setting is set to `true`, the consent experience will be based on the the behavior instead of the geoLocation detection
     * - `expressed` - CCM Popup window is loaded for website visitors.
     * - `implied`  - CCM Banner is loaded for new website visitors.
     */
    consentModelBasedOnConsentExperience?: boolean

    /**
     * Enable debug logging for TrustArc wrapper
     */
    enableDebugLogging?: boolean

    /**
     *  When this setting is set to true, segment will always load as it's a requried category. 
     *  It will stil populate the user's consent choices to prevent other destinations from loading, 
     *  but will always load regardless so that requied destinations can load. 
     *
     *  IMPORTANT: Always check this with your privacy team before enabling this functionality;
     *
     */
    alwaysLoadSegment?: boolean,

    /**
     * When this setting is set to true, locations that are not explicitly provisioned in TrustArc will be considered as opt-out.
     */
    considerUnprovisionedLocationsAsOptOut?: boolean
}

const shouldLoadWrapper = async () => {
    await resolveWhen(() => {
        const TrustArc = getTrustArcGlobal()

        // Wrapper can load when TrustArc is done loading and the API is ready
        return TrustArc !== undefined && TrustArc.cma !== undefined
    }, 500)
};


const getCategories = (settings: TrustArcSettings) => {
    const consentModel = getConsentModel(settings);

    return getNormalizedCategories(consentModel)
};

const getConsentModel = (settings: TrustArcSettings) => {
    const TrustArc = getTrustArcGlobal()!
    let consentModel = 'opt-in';

    // When the location is unprovisioned, we consider it as opt-out if the setting is enabled.
    // If the setting is not enabled, we continue with the normal flow as unprovisioned locations 
    // will be treated as opt-in by default or use the configured defaults when consentModelBasedOnConsentExperience is used.
    if (settings.considerUnprovisionedLocationsAsOptOut === true) {
        const consentDecision = TrustArc.cma.callApi('getGDPRConsentDecision', window.location.hostname);
        if (consentDecision.source === 'unprovisioned') {
            settings.enableDebugLogging && log('getConsentModel triggered and returned opt-out based on unprovisioned location.');
            return 'opt-out';
        }
    }

    if (settings.consentModelBasedOnConsentExperience === true) {
        consentModel = coerceConsentModel(getConsentExperience());
        settings.enableDebugLogging && log(`getConsentModel triggered and returned ${consentModel} based on consent experience.`);
        return consentModel;
    }

    if (typeof settings.consentModel === 'function') {
        consentModel = settings.consentModel();
        settings.enableDebugLogging && log(`getConsentModel triggered and returned ${consentModel} based on overridden consent model function.`);
        return consentModel;
    }


    // If no custom settings, use TrustArc's default behavior
    consentModel = coerceConsentModel(TrustArc.eu.bindMap.behaviorManager);
    settings.enableDebugLogging && log(`getConsentModel triggered and returned ${consentModel} based on behaviorManager.`);
    return consentModel;
};


/**
 *  Function to define when Segment should load. 
 *
 */
const shouldLoadSegment = async (ctx: any, settings: TrustArcSettings) => {
    const consentModel = getConsentModel(settings);

    if (consentModel === 'opt-out') {
        return ctx.load({
            consentModel: 'opt-out',
        })
    } else {
        await resolveWhen(() => {
            // If segment is supposed to always load, then no need to check for active groups. 
            if (settings.alwaysLoadSegment != undefined && settings.alwaysLoadSegment) {
                return true;
            }

            const activeGroups = getNormalizedActiveGroupIds(consentModel);

            // Remove the first group as it's the required bucket
            activeGroups.shift();

            // Resolve if there's at least one group accepted (except the first group Required)
            return activeGroups.some(active => active)
        }, 500)
        return ctx.load({ consentModel: 'opt-in' })
    }
};

/**
 *
 * @param analyticsInstance - An analytics instance. Either `window.analytics`, or the instance returned by `new AnalyticsBrowser()` or `AnalyticsBrowser.load({...})`
 * @param settings - Optional settings for configuring your OneTrust wrapper
 */
export const withTrustArc = <Analytics extends AnyAnalytics>(
    analyticsInstance: Analytics,
    settings: TrustArcSettings = {}
): Analytics => {
    const enableDebugLogging = settings && settings.enableDebugLogging === true;
    enableDebugLogging && log("Loading Segment with TrustArc Wrapper", settings);

    return createWrapper<Analytics>({
        // wait for TrustArc global to be available before wrapper is loaded
        shouldLoadWrapper: shouldLoadWrapper,
        shouldLoadSegment: (ctx) => shouldLoadSegment(ctx, settings),
        getCategories: () => getCategories(settings),
        registerOnConsentChanged: settings.disableConsentChangedEvent
            ? undefined
            : (setCategories) => {
                const TrustArc = getTrustArcGlobal()!
                const consentModel = coerceConsentModel(TrustArc.eu.bindMap.behaviorManager);

                window.addEventListener(
                    'message',
                    (e) => {
                        try {
                            const json = e && e.data != '' && JSON.parse(e.data)
                            if (json && json.message == 'submit_preferences') {
                                // Once identified that the user's preferences were changed, take any actions. On this case we reload.
                                const normalizedCategories = getNormalizedCategories(consentModel)
                                setCategories(normalizedCategories)
                            }
                        } catch (e) {
                            // Message is not from TrustArc
                        }
                    },
                    false
                )
            },
        enableDebugLogging: settings.enableDebugLogging,
    })(analyticsInstance)
}

export const testHelpers = {
    shouldLoadWrapper,
    getCategories,
    shouldLoadSegment
};
