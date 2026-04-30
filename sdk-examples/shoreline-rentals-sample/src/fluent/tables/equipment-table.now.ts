import {
    BooleanColumn,
    ChoiceColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * The master inventory table. Every rentable thing — surfboards, umbrellas,
 * metal detectors, waterproof speakers — lives here.
 *
 * `available_quantity` is decremented/incremented by business rules on the
 * rental-request table; `condition` is updated from the UI action on returns.
 */
export const x_1939459_shorelin_equipment = Table({
    name: 'x_1939459_shorelin_equipment',
    label: 'Rental Equipment',
    schema: {
        name: StringColumn({ label: 'Equipment Name', mandatory: true }),
        sku: StringColumn({
            label: 'SKU',
            maxLength: 40,
        }),
        category: ReferenceColumn({
            label: 'Category',
            referenceTable: 'x_1939459_shorelin_category',
            mandatory: true,
        }),
        location: ReferenceColumn({
            label: 'Home Stand',
            referenceTable: 'x_1939459_shorelin_location',
            mandatory: true,
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        total_quantity: IntegerColumn({
            label: 'Total Quantity',
            mandatory: true,
            default: 1,
        }),
        available_quantity: IntegerColumn({
            label: 'Available Quantity',
            mandatory: true,
            default: 1,
        }),
        hourly_rate: DecimalColumn({ label: 'Hourly Rate ($)', default: 0 }),
        half_day_rate: DecimalColumn({ label: 'Half-Day Rate ($)' }),
        full_day_rate: DecimalColumn({ label: 'Full-Day Rate ($)' }),
        weekly_rate: DecimalColumn({ label: 'Weekly Rate ($)' }),
        deposit: DecimalColumn({
            label: 'Security Deposit ($)',
            default: 0,
        }),
        replacement_cost: DecimalColumn({
            label: 'Replacement Cost ($)',
            default: 0,
        }),
        condition: ChoiceColumn({
            label: 'Condition',
            default: 'good',
            choices: {
                new: { label: 'New' },
                good: { label: 'Good' },
                fair: { label: 'Fair' },
                needs_maintenance: { label: 'Needs Maintenance' },
                retired: { label: 'Retired' },
            },
        }),
        requires_waiver: BooleanColumn({
            label: 'Requires Waiver',
            default: false,
        }),
        weather_sensitive: BooleanColumn({
            label: 'Weather Sensitive (auto-refund on storm)',
            default: false,
        }),
        featured: BooleanColumn({
            label: 'Featured on Portal',
            default: false,
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
        image_url: StringColumn({ label: 'Image URL', maxLength: 500 }),
    },
    display: 'name',
    index: [{ element: 'sku', name: 'equipment_sku_idx', unique: true }],
})
