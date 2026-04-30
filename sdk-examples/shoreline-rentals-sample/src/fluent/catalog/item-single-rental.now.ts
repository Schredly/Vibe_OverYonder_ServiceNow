import {
    CatalogItem,
    ContainerEndVariable,
    ContainerSplitVariable,
    ContainerStartVariable,
    DateTimeVariable,
    MultiLineTextVariable,
    ReferenceVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
    YesNoVariable,
} from '@servicenow/sdk/core'
import { shorelineServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Single-item rental. Pick one piece of equipment, a window, a location.
 * This is the workhorse item — probably 70% of orders.
 */
export const singleRentalCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_single_rental'],
    name: 'Rent a Single Item',
    shortDescription:
        'Rent one piece of beach gear — umbrella, chair, board, speaker, and more.',
    description:
        'Pick one item, tell us when and where, and the stand will have it ready for pickup. A security deposit may apply on some items.',
    availability: 'both',
    order: 100,
    catalogs: [shorelineServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    mandatoryAttachment: false,
    visibleBundle: true,
    visibleGuide: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        // -------- Equipment & location --------
        equip_start: ContainerStartVariable({
            question: 'Equipment Selection',
            displayTitle: true,
            layout: '2across',
            order: 500,
        }),
        equipment: ReferenceVariable({
            question: 'Equipment',
            order: 600,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_equipment',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true^available_quantity>0',
        }),
        quantity: SingleLineTextVariable({
            question: 'Quantity',
            order: 700,
            mandatory: true,
            defaultValue: '1',
        }),
        equip_split: ContainerSplitVariable({ order: 750 }),
        pickup_location: ReferenceVariable({
            question: 'Pickup Location',
            order: 800,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_location',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        equip_end: ContainerEndVariable({ order: 900 }),

        // -------- Window --------
        window_start: ContainerStartVariable({
            question: 'Rental Window',
            displayTitle: true,
            layout: '2across',
            order: 1000,
        }),
        pricing_tier: SelectBoxVariable({
            question: 'Pricing Tier',
            order: 1100,
            mandatory: true,
            choices: {
                hourly: { label: 'Hourly' },
                half_day: { label: 'Half-Day (4 hrs)' },
                full_day: { label: 'Full-Day (8 hrs)' },
                weekly: { label: 'Weekly' },
            },
            includeNone: false,
        }),
        reservation_start: DateTimeVariable({
            question: 'Start',
            order: 1200,
            mandatory: true,
        }),
        window_split: ContainerSplitVariable({ order: 1250 }),
        reservation_end: DateTimeVariable({
            question: 'End',
            order: 1300,
            mandatory: true,
        }),
        window_end: ContainerEndVariable({ order: 1400 }),

        // -------- Extras --------
        waiver_signed: YesNoVariable({
            question:
                'I acknowledge the rental waiver (required for surfboards, SUPs, kayaks, bikes, GoPros, bonfires).',
            order: 1500,
            defaultValue: false,
        }),
        request_notes: MultiLineTextVariable({
            question: 'Special requests or notes',
            order: 1600,
        }),
    },
})
