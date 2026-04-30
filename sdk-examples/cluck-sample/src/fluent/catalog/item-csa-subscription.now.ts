import {
    CatalogItem,
    DateVariable,
    MultiLineTextVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * CSA (Community-Supported Agriculture) egg subscription. Weekly/biweekly
 * recurring egg delivery. Discount applied automatically.
 */
export const csaSubscriptionCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_csa'],
    name: 'Egg CSA Subscription',
    shortDescription:
        'Sign up for weekly or biweekly egg deliveries. Save 10%, never run out.',
    description:
        'Become a CSA member. You get your dozens on the same day every week, priority access to seasonal specialties, and a members-only 10% discount.',
    availability: 'both',
    order: 200,
    catalogs: [cluckServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        frequency: SelectBoxVariable({
            question: 'Frequency',
            order: 500,
            mandatory: true,
            choices: {
                weekly: { label: 'Weekly' },
                biweekly: { label: 'Biweekly (every 2 weeks)' },
                monthly: { label: 'Monthly' },
            },
            includeNone: false,
        }),
        dozen_count: SingleLineTextVariable({
            question: 'Dozens per delivery',
            order: 600,
            mandatory: true,
            defaultValue: '2',
        }),
        egg_grade: SelectBoxVariable({
            question: 'Egg Grade',
            order: 700,
            mandatory: true,
            choices: {
                large: { label: 'Large (standard)' },
                xlarge: { label: 'X-Large (+$1/dozen)' },
                mixed: { label: 'Mixed rainbow basket' },
            },
            includeNone: false,
        }),
        delivery_day: SelectBoxVariable({
            question: 'Delivery Day',
            order: 800,
            mandatory: true,
            choices: {
                tuesday: { label: 'Tuesday' },
                thursday: { label: 'Thursday' },
                saturday: { label: 'Saturday' },
            },
            includeNone: false,
        }),
        delivery_mode: SelectBoxVariable({
            question: 'Delivery Mode',
            order: 900,
            mandatory: true,
            choices: {
                pickup: { label: 'Pick up at the farm' },
                farm_stand: { label: 'Farm stand self-serve' },
                delivery: { label: 'Local delivery' },
                market: { label: 'Farmers market hand-off' },
            },
            includeNone: false,
        }),
        start_date: DateVariable({
            question: 'Start Date',
            order: 1000,
            mandatory: true,
        }),
        dietary_notes: MultiLineTextVariable({
            question: 'Notes / allergies / gate codes',
            order: 1100,
        }),
    },
})
