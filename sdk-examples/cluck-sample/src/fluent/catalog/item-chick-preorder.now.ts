import {
    CatalogItem,
    MultiLineTextVariable,
    ReferenceVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Chick pre-order — reserve newly-hatched chicks of a specific breed.
 * Links to an incubation batch when one is scheduled.
 */
export const chickPreorderCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_chicks'],
    name: 'Chick Pre-order',
    shortDescription:
        'Reserve newly-hatched chicks of your chosen breed. Pickup at day-of-hatch.',
    description:
        'Heritage and rare-egg breeds go fast. Reserve now and we\'ll notify you on hatch day. Minimum 3 chicks per order (they need buddies to stay warm).',
    availability: 'both',
    order: 500,
    catalogs: [cluckServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        breed: ReferenceVariable({
            question: 'Breed',
            order: 500,
            mandatory: true,
            referenceTable: 'x_1939459_cluck_breed',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        quantity: SingleLineTextVariable({
            question: 'Quantity (minimum 3)',
            order: 600,
            mandatory: true,
            defaultValue: '3',
        }),
        sex_preference: SelectBoxVariable({
            question: 'Sex Preference',
            order: 700,
            mandatory: true,
            choices: {
                pullet: { label: 'Pullet (female) only — $2/chick premium' },
                straight: { label: 'Straight run (mixed, day-old sexing unreliable)' },
                cockerel: { label: 'Cockerel (male) only — discounted' },
            },
            includeNone: false,
        }),
        target_month: SelectBoxVariable({
            question: 'Target Hatch Month',
            order: 800,
            mandatory: true,
            choices: {
                march: { label: 'March' },
                april: { label: 'April' },
                may: { label: 'May' },
                june: { label: 'June' },
                july: { label: 'July' },
                august: { label: 'August' },
                september: { label: 'September' },
                flexible: { label: 'Flexible (any upcoming batch)' },
            },
            includeNone: false,
        }),
        setup_notes: MultiLineTextVariable({
            question: 'Got a brooder set up? Any questions?',
            order: 900,
        }),
    },
})
