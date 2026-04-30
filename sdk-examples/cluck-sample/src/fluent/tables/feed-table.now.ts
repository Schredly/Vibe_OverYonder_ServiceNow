import {
    BooleanColumn,
    ChoiceColumn,
    DecimalColumn,
    IntegerColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Feed inventory. Tracks each feed SKU — type, supplier, bag size, cost,
 * current on-hand count. A business rule fires a reorder task when
 * on_hand_bags < reorder_threshold.
 */
export const x_1939459_cluck_feed = Table({
    name: 'x_1939459_cluck_feed',
    label: 'Feed',
    schema: {
        name: StringColumn({ label: 'Feed Name', mandatory: true }),
        sku: StringColumn({ label: 'SKU', maxLength: 40 }),
        feed_type: ChoiceColumn({
            label: 'Feed Type',
            mandatory: true,
            default: 'layer',
            choices: {
                starter: { label: 'Starter (0-8 wks)' },
                grower: { label: 'Grower (8-18 wks)' },
                layer: { label: 'Layer (18+ wks)' },
                broiler: { label: 'Broiler / meat' },
                scratch: { label: 'Scratch grains' },
                treat: { label: 'Treats (mealworms, corn, etc.)' },
                supplement: { label: 'Supplement (oyster shell, grit)' },
            },
        }),
        supplier: StringColumn({ label: 'Supplier' }),
        bag_size_kg: DecimalColumn({ label: 'Bag Size (kg)', default: 22.7 }),
        cost_per_bag: DecimalColumn({ label: 'Cost per Bag ($)', default: 25 }),
        protein_pct: DecimalColumn({ label: 'Protein %', default: 16 }),
        organic: BooleanColumn({ label: 'Certified Organic', default: false }),
        non_gmo: BooleanColumn({ label: 'Non-GMO', default: false }),
        on_hand_bags: IntegerColumn({
            label: 'On Hand (bags)',
            mandatory: true,
            default: 0,
        }),
        reorder_threshold: IntegerColumn({
            label: 'Reorder Threshold (bags)',
            default: 2,
        }),
        reorder_quantity: IntegerColumn({
            label: 'Reorder Quantity (bags)',
            default: 10,
        }),
        last_delivery_date: StringColumn({ label: 'Last Delivery' }),
        storage_location: StringColumn({ label: 'Storage Location' }),
        notes: StringColumn({ label: 'Notes', maxLength: 2000 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'name',
    index: [{ element: 'sku', name: 'feed_sku_idx', unique: true }],
})
