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
    // TODO: Add logs
    enableDebugLogging?: boolean

    /**
     *  When this setting is set to true, segment will always load as it's a requried category. 
     *  It will stil populate the user's consent choices to prevent other destinations from loading, 
     *  but will always load regardless so that requied destinations can load. 
     *
     *  IMPORTANT: Always check this with your privacy team before enabling this functionality;
     *
     */
    alwaysLoadSegment?: boolean
}

const shouldLoadWrapper = async () => {
    await resolveWhen(() => {
        return getTrustArcGlobal() !== undefined
    }, 500)
};

const getCategories = () => {
    const TrustArc = getTrustArcGlobal()!
    const consentModel = coerceConsentModel(TrustArc.eu.bindMap.behaviorManager);

    return getNormalizedCategories(consentModel)
};


/**
 *  Function to define when Segment should load. 
 *
 */
const shouldLoadSegment = async (ctx: any, settings: TrustArcSettings) => {
    const TrustArc = getTrustArcGlobal()!
    const enableDebugLogging = settings && settings.enableDebugLogging === true;

    let consentModel = 'opt-in'; // Default

    if (settings.consentModelBasedOnConsentExperience != undefined && settings.consentModelBasedOnConsentExperience == true) {
        consentModel = coerceConsentModel(getConsentExperience());
        enableDebugLogging && console.log(`Wrapper initilized with consent model based on consent experience: ${consentModel}`);
    }
    else if (settings.consentModel !== undefined) {
        enableDebugLogging && console.log(`Wrapper initilized with overriden consent model: ${settings.consentModel()}`);
        consentModel = settings.consentModel();
    } else {
        // If there's no override, we obtain this from TrustArc's settings
        consentModel = coerceConsentModel(TrustArc.eu.bindMap.behaviorManager);
        enableDebugLogging && console.log(`Wrapper initilized with consent model: ${consentModel}`);
    }

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
    enableDebugLogging && console.log("Loading Segment with TrustArc Wrapper", settings);

    return createWrapper<Analytics>({
        // wait for TrustArc global to be available before wrapper is loaded
        shouldLoadWrapper: shouldLoadWrapper,
        shouldLoadSegment: (ctx) => shouldLoadSegment(ctx, settings),
        getCategories: getCategories,
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
