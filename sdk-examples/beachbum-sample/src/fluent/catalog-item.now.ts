import {
    CatalogItem,
    SelectBoxVariable,
    SingleLineTextVariable,
    EmailVariable,
    MultiLineTextVariable,
    DateVariable,
    ContainerStartVariable,
    ContainerSplitVariable,
    ContainerEndVariable,
} from '@servicenow/sdk/core'

/**
 * Service Catalog item for customers to request beach equipment
 */
// Service Catalog (default catalog in all ServiceNow instances)
const serviceCatalog = 'e0d08b13c3330100c8b837659bba8fb4'

export const beachEquipmentRequest = CatalogItem({
    $id: Now.ID['beach_equipment_catalog_item'],
    name: 'Beach Equipment Rental',
    shortDescription: 'Rent beach equipment from Beach Bum',
    description:
        'Use this form to rent beach chairs, umbrellas, surfboards, boogie boards, towels, and more from Beach Bum.',
    availability: 'both',
    order: 100,
    catalogs: [serviceCatalog],

    // Portal settings
    requestMethod: 'order',
    hideAddToCart: true,
    hideQuantitySelector: true,
    mandatoryAttachment: false,

    // Visibility
    visibleBundle: true,
    visibleGuide: true,
    visibleStandalone: true,

    variables: {
        // -- Customer Info Section --
        customer_info_start: ContainerStartVariable({
            question: 'Customer Information',
            displayTitle: true,
            layout: '2across',
            order: 100,
        }),

        customer_name: SingleLineTextVariable({
            question: 'Customer Name',
            order: 200,
            mandatory: true,
        }),

        customer_phone: SingleLineTextVariable({
            question: 'Phone Number',
            order: 300,
            mandatory: true,
        }),

        customer_info_split: ContainerSplitVariable({ order: 350 }),

        customer_email: EmailVariable({
            question: 'Email Address',
            order: 400,
        }),

        rental_date: DateVariable({
            question: 'Rental Date',
            order: 500,
            mandatory: true,
        }),

        customer_info_end: ContainerEndVariable({ order: 600 }),

        // -- Equipment Selection Section --
        equipment_start: ContainerStartVariable({
            question: 'Equipment Selection',
            displayTitle: true,
            layout: '2across',
            order: 700,
        }),

        equipment_type: SelectBoxVariable({
            question: 'Equipment Type',
            order: 800,
            mandatory: true,
            choices: {
                chair: { label: 'Beach Chair - $10/day' },
                umbrella: { label: 'Umbrella - $15/day' },
                boogie_board: { label: 'Boogie Board - $12/day' },
                surfboard: { label: 'Surfboard - $25/day' },
                towel: { label: 'Towel - $5/day' },
                cooler: { label: 'Cooler - $8/day' },
                snorkel_set: { label: 'Snorkel Set - $15/day' },
            },
            includeNone: false,
        }),

        quantity: SingleLineTextVariable({
            question: 'Quantity',
            order: 900,
            mandatory: true,
            defaultValue: '1',
        }),

        equipment_split: ContainerSplitVariable({ order: 950 }),

        rental_duration: SelectBoxVariable({
            question: 'Rental Duration',
            order: 1000,
            mandatory: true,
            choices: {
                half_day: { label: 'Half Day (4 hours)' },
                full_day: { label: 'Full Day' },
                two_days: { label: '2 Days' },
                three_days: { label: '3 Days' },
                week: { label: '1 Week' },
            },
            includeNone: false,
        }),

        return_date: DateVariable({
            question: 'Expected Return Date',
            order: 1100,
            mandatory: true,
        }),

        equipment_end: ContainerEndVariable({ order: 1200 }),

        // -- Additional Info --
        special_requests: MultiLineTextVariable({
            question: 'Special Requests or Notes',
            order: 1300,
        }),
    },
})
