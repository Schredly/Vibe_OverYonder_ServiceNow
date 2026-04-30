import {
    CatalogItem,
    DateTimeVariable,
    MultiLineTextVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
    YesNoVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Farm Tour booking. 45-minute guided walk, optional egg-gathering add-on.
 */
export const farmTourCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_tour'],
    name: 'Farm Tour Booking',
    shortDescription:
        'Come meet the flock. 45-min guided tour; add the egg-gathering experience for the kids.',
    description:
        'Bring the family. We walk you through the coops, introduce the celebrity hens, and let you meet General Tso (from a safe distance). Add the egg-gathering experience and walk away with a warm dozen.',
    availability: 'both',
    order: 400,
    catalogs: [cluckServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        tour_date: DateTimeVariable({
            question: 'Preferred date & time',
            order: 500,
            mandatory: true,
        }),
        party_size: SingleLineTextVariable({
            question: 'Party size',
            order: 600,
            mandatory: true,
            defaultValue: '2',
        }),
        add_egg_hunt: YesNoVariable({
            question: 'Add egg-gathering experience (+$10/person)',
            order: 700,
            defaultValue: false,
        }),
        tour_type: SelectBoxVariable({
            question: 'Tour Style',
            order: 800,
            mandatory: true,
            choices: {
                general: { label: 'General tour (meet the flock)' },
                kids: { label: "Kids' tour (hands-on with chicks)" },
                breeder: { label: "Breeder's deep-dive (heritage genetics)" },
                photo: { label: 'Photography tour (golden hour)' },
            },
            includeNone: false,
        }),
        accessibility_needs: MultiLineTextVariable({
            question: 'Accessibility needs or requests?',
            order: 900,
        }),
    },
})
