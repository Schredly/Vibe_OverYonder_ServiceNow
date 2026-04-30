import { CatalogUiPolicy } from '@servicenow/sdk/core'
import { singleRentalCatalogItem } from './item-single-rental.now'

/**
 * If the selected equipment requires a waiver, force the waiver_signed toggle
 * to mandatory and visible. Evaluated on load and on change of `equipment`.
 *
 * `catalogCondition` uses an encoded query — ServiceNow swaps the variable
 * reference for the real question sys_id at build time.
 */
export const waiverMandatoryPolicy = CatalogUiPolicy({
    $id: Now.ID['ui_policy_waiver_mandatory'],
    shortDescription:
        'Force waiver checkbox when the picked equipment requires one',
    catalogItem: singleRentalCatalogItem,
    appliesTo: 'item',
    active: true,
    onLoad: true,
    reverseIfFalse: true,
    catalogCondition: `${singleRentalCatalogItem.variables.equipment}.requires_waiver=true`,
    appliesOnCatalogItemView: true,
    appliesOnRequestedItems: true,
    order: 100,
    actions: [
        {
            variableName: singleRentalCatalogItem.variables.waiver_signed,
            mandatory: true,
            visible: true,
        },
    ],
})
