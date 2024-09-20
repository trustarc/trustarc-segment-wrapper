import { Categories, ConsentModel } from '@segment/analytics-consent-tools'
import { TrustArcApiValidationError } from './validation'
/**
 * @example ["1", "2"]
 */
type ActiveGroupIds = string[]

type GroupInfoDto = {
    CustomGroupId: string
}

type TaConsentChangedEvent = CustomEvent<ActiveGroupIds>

export enum TaConsentModel {
    optIn = 'opt-in',
    optOut = 'opt-out',
    implicit = 'implied consent',
}

export interface TrustArcDomainData {
    ShowAlertNotice: boolean
    Groups: GroupInfoDto[]
    ConsentModel: {
        Name: TaConsentModel
    }
}
/**
 * The data model used by the TrustArc lib
 */
export interface TrustArcGlobal {
    GetDomainData: () => TrustArcDomainData
    /**
     *  This callback appears to fire whenever the alert box is closed, no matter what.
     * E.g:
     * - if a user continues without accepting
     * - if a user makes a selection
     * - if a user rejects all
     */
    OnConsentChanged: (cb: (event: TaConsentChangedEvent) => void) => void
    IsAlertBoxClosed: () => boolean
    eu: any
    cma: any
}

export const getTrustArcGlobal = (): TrustArcGlobal | undefined => {
    // truste is the global object for TrustArc
    // truste.cma enables the consent API
    // truste.eu.bindMap has all the consent manager settings
    const trustArc = (window as any).truste
    if (!trustArc || !trustArc.cma || !trustArc.cma.callApi) return undefined

    return trustArc
}

/**
 *  We don't support all consent models, so we need to coerce them to the ones we do support.
 */
export const coerceConsentModel = (model: TaConsentModel): ConsentModel => {
    switch (model) {
        case TaConsentModel.optIn:
        case TaConsentModel.implicit:
            return 'opt-in'
        case TaConsentModel.optOut:
            return 'opt-out'
        default: // there are some others like 'custom' / 'notice' that should be treated as 'opt-out'
            return 'opt-out'
    }
}

export type GroupInfo = {
    groupId: string
}

/**
 * get *all* groups / categories, not just active ones
 */
export const getAllGroups = (): GroupInfo[] => {
    const trustArcGlobal = getTrustArcGlobal()
    if (!trustArcGlobal) return []

    // TrustArc groups are indexed starting from 1. So groups will be 1, 2, 3...., n where n is categoryCount;
    const numberOfGroups = trustArcGlobal.eu.bindMap.categoryCount
    const consentGroups = []

    for (let index = 1; index <= numberOfGroups; index++) {
        consentGroups.push({ groupId: `${index}` })
    }

    return consentGroups
}

export const getTrustArcActiveGroups = (): string | undefined => {
    const groups = (window as any).TrustArcActiveGroups
    if (!groups) return undefined
    if (typeof groups !== 'string') {
        throw new TrustArcApiValidationError(
            `window.TrustArcActiveGroups is not a string`,
            groups
        )
    }
    return groups
}

/**
 * @example
 * ",1,2" => ["1", "2"]
 */
const normalizeActiveGroupIds = (
    trustArcActiveGroups: string
): ActiveGroupIds => {
    return trustArcActiveGroups.trim().split(',').filter(Boolean)
}

export const getNormalizedActiveGroupIds = (
    trustArcActiveGroups = ''
): ActiveGroupIds => {
    const trustArcGlobal = getTrustArcGlobal()
    if (trustArcGlobal) {
        const decision = trustArcGlobal.cma.callApi(
            'getGDPRConsentDecision',
            trustArcGlobal.eu.bindMap.domain
        )

        trustArcActiveGroups = decision.consentDecision[0]

        for (let index = 1; index < decision.consentDecision.length; index++) {
            const element = decision.consentDecision[index]
            trustArcActiveGroups += `,${element}`
        }
    }

    if (!trustArcActiveGroups) {
        return []
    }

    return normalizeActiveGroupIds(trustArcActiveGroups || '')
}

export const getNormalizedCategories = (
    activeGroupIds = getNormalizedActiveGroupIds()
): Categories => {
    return getAllGroups().reduce<Categories>((acc, group) => {
        const categories = {
            ...acc,
            [group.groupId]: activeGroupIds.includes(group.groupId),
        }
        return categories
    }, {})
}
