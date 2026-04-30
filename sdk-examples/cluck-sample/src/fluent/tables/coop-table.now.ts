import {
    BooleanColumn,
    ChoiceColumn,
    IntegerColumn,
    DateColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Physical coops / chicken houses on the farm. Each coop hosts a flock
 * and has a capacity ceiling we enforce via business rule.
 */
export const x_1939459_cluck_coop = Table({
    name: 'x_1939459_cluck_coop',
    label: 'Coop',
    schema: {
        name: StringColumn({ label: 'Coop Name', mandatory: true }),
        capacity: IntegerColumn({
            label: 'Max Capacity (birds)',
            mandatory: true,
            default: 25,
        }),
        square_meters: IntegerColumn({ label: 'Square Meters', default: 10 }),
        style: ChoiceColumn({
            label: 'Coop Style',
            default: 'fixed',
            choices: {
                fixed: { label: 'Fixed / stationary' },
                mobile: { label: 'Mobile / chicken tractor' },
                pasture: { label: 'Open-pasture shelter' },
                hoop: { label: 'Hoop house' },
            },
        }),
        heating: BooleanColumn({ label: 'Heated', default: false }),
        automatic_door: BooleanColumn({ label: 'Automatic Pop Door', default: false }),
        nest_boxes: IntegerColumn({ label: 'Nest Boxes', default: 6 }),
        roost_length_m: IntegerColumn({ label: 'Roost Length (m)', default: 3 }),
        ventilation_rating: ChoiceColumn({
            label: 'Ventilation Rating',
            default: 'good',
            choices: {
                poor: { label: 'Poor' },
                adequate: { label: 'Adequate' },
                good: { label: 'Good' },
                excellent: { label: 'Excellent' },
            },
        }),
        location_notes: StringColumn({ label: 'Location Notes', maxLength: 1000 }),
        last_cleaned: DateColumn({ label: 'Last Deep Clean' }),
        cleaning_due_date: DateColumn({ label: 'Next Cleaning Due' }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'name',
})
