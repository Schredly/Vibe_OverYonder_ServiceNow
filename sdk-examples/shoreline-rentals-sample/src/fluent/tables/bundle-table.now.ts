import {
    BooleanColumn,
    ChoiceColumn,
    DecimalColumn,
    ListColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * A "bundle" is a curated multi-item package priced at a discount. Customers
 * pick a bundle from the catalog (Family Fun Pack, Surf Session, etc.) and the
 * fulfillment flow creates a rental-request-line for each included equipment.
 */
export const x_1939459_shorelin_bundle = Table({
    name: 'x_1939459_shorelin_bundle',
    label: 'Rental Bundle',
    schema: {
        name: StringColumn({ label: 'Bundle Name', mandatory: true }),
        tagline: StringColumn({
            label: 'Tagline',
            maxLength: 160,
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        theme: ChoiceColumn({
            label: 'Theme',
            default: 'family',
            choices: {
                family: { label: 'Family' },
                surf: { label: 'Surf' },
                sunset: { label: 'Sunset / Chill' },
                kids: { label: 'Kids' },
                romantic: { label: 'Romantic' },
                adventure: { label: 'Adventure' },
                party: { label: 'Party' },
            },
        }),
        included_equipment: ListColumn({
            label: 'Included Equipment',
            referenceTable: 'x_1939459_shorelin_equipment',
        }),
        includes_summary: StringColumn({
            label: 'Human-readable inclusion list',
            maxLength: 1000,
        }),
        list_price: DecimalColumn({ label: 'List Price ($)' }),
        bundle_price: DecimalColumn({
            label: 'Bundle Price ($)',
            mandatory: true,
        }),
        savings: DecimalColumn({ label: 'Savings ($)' }),
        max_duration_hours: DecimalColumn({
            label: 'Max Duration (hours)',
            default: 8,
        }),
        featured: BooleanColumn({ label: 'Featured', default: true }),
        active: BooleanColumn({ label: 'Active', default: true }),
        image_url: StringColumn({ label: 'Image URL', maxLength: 500 }),
    },
    display: 'name',
})
