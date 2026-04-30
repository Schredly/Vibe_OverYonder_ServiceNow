import {
    ChoiceColumn,
    DateTimeColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Incident — anything bad that happens: predator attacks, escapes, disease
 * outbreaks, broken fencing, egg theft. Extends task for workflow.
 * Customers can submit quality issues through the record producer.
 */
export const x_1939459_cluck_incident = Table({
    name: 'x_1939459_cluck_incident',
    label: 'Incident',
    extends: 'task',
    extensible: true,
    display: 'number',
    auto_number: {
        prefix: 'CINC',
        number: 1001,
        number_of_digits: 7,
    },
    schema: {
        incident_type: ChoiceColumn({
            label: 'Incident Type',
            mandatory: true,
            default: 'predator',
            choices: {
                predator: { label: 'Predator attack' },
                escape: { label: 'Escape / breach' },
                disease: { label: 'Disease outbreak' },
                fencing: { label: 'Fencing / structure damage' },
                theft: { label: 'Theft (eggs or birds)' },
                quality: { label: 'Product quality complaint' },
                delivery: { label: 'Delivery issue' },
                other: { label: 'Other' },
            },
        }),
        severity: ChoiceColumn({
            label: 'Severity',
            mandatory: true,
            default: 'minor',
            choices: {
                minor: { label: 'Minor' },
                moderate: { label: 'Moderate' },
                major: { label: 'Major' },
                critical: { label: 'Critical' },
            },
        }),
        occurred_at: DateTimeColumn({ label: 'When It Happened' }),
        affected_flock: ReferenceColumn({
            label: 'Affected Flock',
            referenceTable: 'x_1939459_cluck_flock',
        }),
        affected_coop: ReferenceColumn({
            label: 'Affected Coop',
            referenceTable: 'x_1939459_cluck_coop',
        }),
        predator_species: ChoiceColumn({
            label: 'Predator (if applicable)',
            choices: {
                hawk: { label: 'Hawk' },
                owl: { label: 'Owl' },
                fox: { label: 'Fox' },
                coyote: { label: 'Coyote' },
                raccoon: { label: 'Raccoon' },
                weasel: { label: 'Weasel / mink' },
                snake: { label: 'Snake' },
                dog: { label: 'Dog (stray or neighbor)' },
                rat: { label: 'Rat' },
                unknown: { label: 'Unknown' },
            },
        }),
        birds_lost: IntegerColumn({ label: 'Birds Lost', default: 0 }),
        birds_injured: IntegerColumn({ label: 'Birds Injured', default: 0 }),
        eggs_lost: IntegerColumn({ label: 'Eggs Lost', default: 0 }),
        estimated_cost: IntegerColumn({ label: 'Est. Cost ($)', default: 0 }),
        evidence_notes: StringColumn({ label: 'Evidence / Description', maxLength: 4000 }),
        photo_url: StringColumn({ label: 'Photo URL', maxLength: 500 }),
        preventive_action: StringColumn({
            label: 'Preventive Action Taken',
            maxLength: 4000,
        }),
        reported_by_customer: ReferenceColumn({
            label: 'Reported By Customer',
            referenceTable: 'x_1939459_cluck_customer',
        }),
    },
})
