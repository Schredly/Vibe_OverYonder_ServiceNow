import {
    BooleanColumn,
    ChoiceColumn,
    DateColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Health / vet record. Extends `task` for number, state, assignment, work_notes.
 * Tied to either a specific bird or a whole flock (for group treatments).
 *
 * withdrawal_period_days — after medication, eggs/meat can't be sold for this
 * many days. A scheduled check surfaces birds whose withdrawal is active.
 */
export const x_1939459_cluck_health_record = Table({
    name: 'x_1939459_cluck_health_record',
    label: 'Health Record',
    extends: 'task',
    extensible: true,
    display: 'number',
    auto_number: {
        prefix: 'HLTH',
        number: 1001,
        number_of_digits: 7,
    },
    schema: {
        bird: ReferenceColumn({
            label: 'Bird',
            referenceTable: 'x_1939459_cluck_bird',
        }),
        flock: ReferenceColumn({
            label: 'Flock (for group treatment)',
            referenceTable: 'x_1939459_cluck_flock',
        }),
        event_type: ChoiceColumn({
            label: 'Event Type',
            mandatory: true,
            default: 'wellness',
            choices: {
                wellness: { label: 'Wellness check' },
                vaccination: { label: 'Vaccination' },
                illness: { label: 'Illness / diagnosis' },
                injury: { label: 'Injury' },
                parasite: { label: 'Parasite treatment (mites/lice/worms)' },
                broken_egg: { label: 'Egg-bound / prolapse' },
                molt: { label: 'Molt management' },
                death: { label: 'Death / postmortem' },
            },
        }),
        diagnosis: StringColumn({ label: 'Diagnosis', maxLength: 1000 }),
        symptoms: StringColumn({ label: 'Symptoms', maxLength: 4000 }),
        treatment: StringColumn({ label: 'Treatment / Notes', maxLength: 4000 }),
        medication: StringColumn({ label: 'Medication' }),
        dosage: StringColumn({ label: 'Dosage' }),
        route: ChoiceColumn({
            label: 'Route of Administration',
            choices: {
                oral: { label: 'Oral' },
                water: { label: 'In water' },
                feed: { label: 'In feed' },
                injection: { label: 'Injection' },
                topical: { label: 'Topical' },
                none: { label: 'N/A' },
            },
        }),
        withdrawal_period_days: IntegerColumn({
            label: 'Withdrawal Period (days)',
            default: 0,
        }),
        withdrawal_ends: DateColumn({ label: 'Withdrawal Ends' }),
        vet_required: BooleanColumn({ label: 'Requires Vet', default: false }),
        vet: ReferenceColumn({
            label: 'Vet / Examiner',
            referenceTable: 'sys_user',
        }),
        cost: DecimalColumn({ label: 'Cost ($)', default: 0 }),
        outcome: ChoiceColumn({
            label: 'Outcome',
            default: 'ongoing',
            choices: {
                ongoing: { label: 'Ongoing' },
                resolved: { label: 'Resolved' },
                chronic: { label: 'Chronic / managed' },
                culled: { label: 'Culled' },
                deceased: { label: 'Deceased' },
            },
        }),
    },
})
