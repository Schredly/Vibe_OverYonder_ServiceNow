import {
    CatalogItem,
    ContainerEndVariable,
    ContainerSplitVariable,
    ContainerStartVariable,
    DateTimeVariable,
    MultiLineTextVariable,
    ReferenceVariable,
    YesNoVariable,
} from '@servicenow/sdk/core'
import { shorelineServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Bundle catalog item. The customer picks a pre-curated bundle (Family Fun
 * Pack, Surf Session, Sunset Chill, etc.). The fulfillment flow reads the
 * bundle's included_equipment and reserves each line.
 */
export const bundleRentalCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_bundle_rental'],
    name: 'Rent a Bundle',
    shortDescription:
        'Save with a curated package — Family Fun Pack, Surf Session, Sunset Chill, and more.',
    description:
        "Our most popular way to rent. Each bundle combines the gear you need at a discount vs. renting individually. Can't beat the price — or the convenience.",
    availability: 'both',
    order: 200,
    catalogs: [shorelineServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    visibleBundle: true,
    visibleGuide: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        bundle_start: ContainerStartVariable({
            question: 'Pick Your Bundle',
            displayTitle: true,
            layout: '2across',
            order: 500,
        }),
        bundle: ReferenceVariable({
            question: 'Bundle',
            order: 600,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_bundle',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        bundle_split: ContainerSplitVariable({ order: 650 }),
        pickup_location: ReferenceVariable({
            question: 'Pickup Location',
            order: 700,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_location',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        bundle_end: ContainerEndVariable({ order: 800 }),

        window_start: ContainerStartVariable({
            question: 'When',
            displayTitle: true,
            layout: '2across',
            order: 900,
        }),
        reservation_start: DateTimeVariable({
            question: 'Start',
            order: 1000,
            mandatory: true,
        }),
        window_split: ContainerSplitVariable({ order: 1050 }),
        reservation_end: DateTimeVariable({
            question: 'End',
            order: 1100,
            mandatory: true,
        }),
        window_end: ContainerEndVariable({ order: 1200 }),

        waiver_signed: YesNoVariable({
            question:
                'I acknowledge the rental waiver (required if the bundle includes restricted items).',
            order: 1300,
            defaultValue: false,
        }),
        request_notes: MultiLineTextVariable({
            question: 'Special requests',
            order: 1400,
        }),
    },
})
