import {
    CatalogItem,
    ContainerEndVariable,
    ContainerSplitVariable,
    ContainerStartVariable,
    DateVariable,
    MultiLineTextVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * "Buy Fresh Eggs" — the daily driver. One-time egg order, pickup or delivery.
 */
export const buyEggsCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_buy_eggs'],
    name: 'Buy Fresh Eggs',
    shortDescription:
        'Pastured eggs, gathered this morning. Pickup, farm-stand, or local delivery.',
    description:
        'Our hens roam, forage, and eat organic layer feed. Pick your grade and how many dozens; delivery is $5 within 10 miles of the farm.',
    availability: 'both',
    order: 100,
    catalogs: [cluckServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    visibleBundle: true,
    visibleGuide: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        // ----- Order -----
        order_start: ContainerStartVariable({
            question: 'Your Egg Order',
            displayTitle: true,
            layout: '2across',
            order: 500,
        }),
        egg_grade: SelectBoxVariable({
            question: 'Egg Grade',
            order: 600,
            mandatory: true,
            choices: {
                jumbo: { label: 'Jumbo ($9.50/dozen)' },
                xlarge: { label: 'X-Large ($8.50/dozen)' },
                large: { label: 'Large ($7.50/dozen)' },
                medium: { label: 'Medium ($6.50/dozen)' },
                mixed: { label: 'Mixed Rainbow Basket ($8.00/dozen)' },
            },
            includeNone: false,
        }),
        egg_dozens: SingleLineTextVariable({
            question: 'How many dozens?',
            order: 700,
            mandatory: true,
            defaultValue: '1',
        }),
        order_split: ContainerSplitVariable({ order: 750 }),
        delivery_type: SelectBoxVariable({
            question: 'Pickup or Delivery',
            order: 800,
            mandatory: true,
            choices: {
                pickup: { label: 'Pick up at the farm (free)' },
                farm_stand: { label: 'Farm stand self-serve (free)' },
                local_delivery: { label: 'Local delivery ($5)' },
                farmers_market: { label: 'Hand off at Saturday market (free)' },
            },
            includeNone: false,
        }),
        order_end: ContainerEndVariable({ order: 900 }),

        // ----- Date + extras -----
        delivery_date: DateVariable({
            question: 'Pickup / Delivery Date',
            order: 1000,
            mandatory: true,
        }),
        special_requests: MultiLineTextVariable({
            question: 'Special requests (double-yolk preference, coop-tour add-on...)',
            order: 1100,
        }),
    },
})
