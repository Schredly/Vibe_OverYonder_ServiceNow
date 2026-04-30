import {
    ChoiceColumn,
    DateColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Incubation batch. 21 days from set to hatch for chicken eggs. We track
 * candling checkpoints and final hatch rate. "Hatch Day" UI action creates
 * bird records from the resulting chicks.
 */
export const x_1939459_cluck_incubation = Table({
    name: 'x_1939459_cluck_incubation',
    label: 'Incubation Batch',
    schema: {
        batch_name: StringColumn({ label: 'Batch Name', mandatory: true }),
        incubator_id: StringColumn({ label: 'Incubator ID' }),
        parent_flock: ReferenceColumn({
            label: 'Parent Flock',
            referenceTable: 'x_1939459_cluck_flock',
        }),
        breed: ReferenceColumn({
            label: 'Breed',
            referenceTable: 'x_1939459_cluck_breed',
        }),
        start_date: DateColumn({ label: 'Set Date', mandatory: true }),
        expected_hatch_date: DateColumn({ label: 'Expected Hatch Date' }),
        actual_hatch_date: DateColumn({ label: 'Actual Hatch Date' }),
        eggs_set: IntegerColumn({
            label: 'Eggs Set',
            mandatory: true,
            default: 0,
        }),
        eggs_viable_day_7: IntegerColumn({
            label: 'Viable at Day 7 (candling)',
            default: 0,
        }),
        eggs_viable_day_14: IntegerColumn({
            label: 'Viable at Day 14 (candling)',
            default: 0,
        }),
        eggs_pipped: IntegerColumn({ label: 'Pipped (started hatching)', default: 0 }),
        chicks_hatched: IntegerColumn({
            label: 'Chicks Hatched',
            default: 0,
        }),
        chicks_alive_day_3: IntegerColumn({
            label: 'Alive at Day 3',
            default: 0,
        }),
        target_temp_f: DecimalColumn({ label: 'Target Temp (°F)', default: 99.5 }),
        target_humidity_pct: DecimalColumn({
            label: 'Target Humidity %',
            default: 50,
        }),
        hatch_rate_pct: DecimalColumn({ label: 'Hatch Rate %', default: 0 }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'incubating',
            choices: {
                incubating: { label: 'Incubating' },
                lockdown: { label: 'Lockdown (day 18+)' },
                hatching: { label: 'Hatching' },
                complete: { label: 'Complete' },
                failed: { label: 'Failed / abandoned' },
            },
        }),
        notes: StringColumn({ label: 'Notes', maxLength: 4000 }),
    },
    display: 'batch_name',
})
