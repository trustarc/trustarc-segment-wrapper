import { Categories, ConsentModel } from '@segment/analytics-consent-tools'
import { TrustArcApiValidationError } from './validation'
/**
 * @example ["ta-1", "ta-2"]
 */
type ActiveGroupIds = string[]
type TaConsentChangedEvent = CustomEvent<ActiveGroupIds>
/*
eu|us are the location managers primarily used for CCM Advanced 
The others are for CCM Pro
Please check the readme file for more information
*/
export enum TaConsentModel {
    eu = 'eu',
    us = 'us',
    na = 'na',
    an = 'an',
    af = 'af',
    as = 'as',
    sa = 'sa',
    oc = 'oc'
}

/**
 * The data model used by the TrustArc lib
 */
export interface TrustArcGlobal {
    /**
     *  This callback appears to fire whenever the alert box is closed, no matter what.
     * E.g:
     * - if a user continues without accepting
     * - if a user makes a selection
     * - if a user rejects all
     */
    OnConsentChanged: (cb: (event: TaConsentChangedEvent) => void) => void
    eu: {
        bindMap: {
            behaviorManager: TaConsentModel,
            categoryCount: number, 
            domain: String
        }
    },
    cma: {
        callApi: (agr0: String, arg1: String) => any
    }
}

export const getTrustArcGlobal = (): TrustArcGlobal | undefined => {
    // truste is the global object for TrustArc
    // truste.cma enables the consent API
    // truste.eu.bindMap has all the consent manager settings
    const trustArc = (window as any).truste
    if (!trustArc || !trustArc.cma || !trustArc.cma.callApi || !trustArc.eu || !trustArc.eu.bindMap) return undefined

    return trustArc
}
export const coerceConsentModel = (model: TaConsentModel): ConsentModel => {
    switch (model) {
        case TaConsentModel.eu:
        case TaConsentModel.an:
        case TaConsentModel.af:
        case TaConsentModel.as:
        case TaConsentModel.sa:
        case TaConsentModel.oc:
            return 'opt-in'
        case TaConsentModel.us:
        case TaConsentModel.na:
            return 'opt-out'
        default: 
            return 'opt-out'
    }
}

export type GroupInfo = {
    groupId: string
}

/**
 * get *all* groups / categories, not just active ones
 */
export const getAllCategories = (): GroupInfo[] => {
    const trustArcGlobal = getTrustArcGlobal()
    if (!trustArcGlobal) return []

    // Segment has a limitation where the consent category can not be an integer. However TrustArc's categories are indexed as integer. 
    // Here we will preappend a string "ta-" for compatinility with Segment.
    // Bucketing will be "ta-1", "ta-2"... "ta-n" being n the amount of categories 
    const numberOfGroups = trustArcGlobal.eu.bindMap.categoryCount
    const consentGroups = []

    for (let index = 1; index <= numberOfGroups; index++) {
        consentGroups.push({ groupId: `ta-${index}` })
    }

    return consentGroups;
}

export const getNormalizedActiveGroupIds = (consentModel: string): ActiveGroupIds => {
    const trustArcGlobal = getTrustArcGlobal()
    let trustArcActiveGroups: string[] = [];

    if (!trustArcGlobal) return [];

    const decision = trustArcGlobal.cma.callApi(
        'getGDPRConsentDecision',
        trustArcGlobal.eu.bindMap.domain
    )

    // If the visitor has provided consent, then return their consent decision
    if(decision.source == "asserted") {
        for (let index = 0; index < decision.consentDecision.length; index++) {
            const element = decision.consentDecision[index]
            trustArcActiveGroups.push(`ta-${element}`);
        }

        return trustArcActiveGroups;
    }

    // At this point it means no consent was provided 
    if(consentModel === 'opt-in') {
        return ["ta-1"]; // Only the required bucket is approved when consent model is 'opt-in' and there's no consent
    } else {
        // consent model is US, eveything is enbaled until there's consent 
        return getAllCategories().map((category) => category.groupId);
    }

    return [];
}

export const getNormalizedCategories = (
    consentModel: string
): Categories => {
    const activeGroupIds = getNormalizedActiveGroupIds(consentModel)

    return getAllCategories().reduce<Categories>((acc, group) => {
        const categories = {
            ...acc,
            [group.groupId]: activeGroupIds.includes(group.groupId),
        }
        return categories
    }, {})
}
