import {
    BooleanColumn,
    ChoiceColumn,
    DateColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * A named grouping of birds. Flocks live in coops, have a purpose, and roll
 * up daily egg counts. Individual birds can be tagged and tied to a flock,
 * but many day-to-day operations happen at the flock level.
 */
export const x_1939459_cluck_flock = Table({
    name: 'x_1939459_cluck_flock',
    label: 'Flock',
    schema: {
        name: StringColumn({ label: 'Flock Name', mandatory: true }),
        coop: ReferenceColumn({
            label: 'Home Coop',
            referenceTable: 'x_1939459_cluck_coop',
            mandatory: true,
        }),
        purpose: ChoiceColumn({
            label: 'Purpose',
            default: 'laying',
            choices: {
                laying: { label: 'Laying' },
                breeding: { label: 'Breeding' },
                meat: { label: 'Meat' },
                brooder: { label: 'Brooder (chicks)' },
                mixed: { label: 'Mixed' },
            },
        }),
        current_count: IntegerColumn({
            label: 'Current Head Count',
            default: 0,
        }),
        established_date: DateColumn({ label: 'Established' }),
        pasture_rotation_days: IntegerColumn({
            label: 'Pasture Rotation (days)',
            default: 7,
        }),
        feed_schedule: ChoiceColumn({
            label: 'Feed Schedule',
            default: 'twice_daily',
            choices: {
                once_daily: { label: 'Once daily (morning)' },
                twice_daily: { label: 'Twice daily' },
                free_feed: { label: 'Free-feed' },
                pasture_only: { label: 'Pasture + scratch only' },
            },
        }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'active',
            choices: {
                active: { label: 'Active' },
                quarantine: { label: 'Quarantine' },
                molting: { label: 'Molting' },
                retired: { label: 'Retired' },
                harvested: { label: 'Harvested' },
            },
        }),
        notes: StringColumn({ label: 'Notes', maxLength: 4000 }),
        featured: BooleanColumn({ label: 'Featured on Portal', default: false }),
    },
    display: 'name',
})
