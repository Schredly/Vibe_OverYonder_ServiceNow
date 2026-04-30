import { CatalogUiPolicy } from '@servicenow/sdk/core'
import { adoptAHenCatalogItem } from '../catalog/item-adopt-a-hen.now'

/**
 * Adopt-a-Hen: when "Is this a gift?" = yes, reveal recipient name + certificate
 * message fields and make the name mandatory.
 */
export const adoptionGiftPolicy = CatalogUiPolicy({
    $id: Now.ID['cup_gift_fields'],
    shortDescription: 'Show gift fields when gift_sponsorship is yes',
    catalogItem: adoptAHenCatalogItem,
    appliesTo: 'item',
    active: true,
    onLoad: true,
    reverseIfFalse: true,
    catalogCondition: `${adoptAHenCatalogItem.variables.gift_sponsorship}=true`,
    appliesOnCatalogItemView: true,
    appliesOnRequestedItems: true,
    order: 100,
    actions: [
        {
            variableName: adoptAHenCatalogItem.variables.recipient_name,
            mandatory: true,
            visible: true,
        },
        {
            variableName: adoptAHenCatalogItem.variables.certificate_message,
            visible: true,
        },
    ],
})
