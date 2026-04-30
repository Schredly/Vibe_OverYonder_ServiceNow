import {
    BooleanColumn,
    ChoiceColumn,
    DateTimeColumn,
    DecimalColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Damage incident. Filed from a catalog record producer (customer self-report),
 * from the "Mark Returned" UI action (staff notes damage on return), or created
 * standalone by staff. Drives the damage-fee calculation on the linked rental.
 */
export const x_1939459_shorelin_damage_report = Table({
    name: 'x_1939459_shorelin_damage_report',
    label: 'Damage Report',
    extends: 'task',
    display: 'number',
    auto_number: {
        prefix: 'DMG',
        number: 100,
        number_of_digits: 7,
    },
    schema: {
        rental_request: ReferenceColumn({
            label: 'Rental Request',
            referenceTable: 'x_1939459_shorelin_rental_request',
        }),
        equipment: ReferenceColumn({
            label: 'Equipment',
            referenceTable: 'x_1939459_shorelin_equipment',
            mandatory: true,
        }),
        severity: ChoiceColumn({
            label: 'Severity',
            mandatory: true,
            default: 'minor',
            choices: {
                cosmetic: { label: 'Cosmetic (no fee)' },
                minor: { label: 'Minor' },
                moderate: { label: 'Moderate' },
                major: { label: 'Major' },
                total_loss: { label: 'Total Loss / Lost' },
            },
        }),
        occurred_at: DateTimeColumn({ label: 'Occurred At' }),
        reported_by: ChoiceColumn({
            label: 'Reported By',
            default: 'staff',
            choices: {
                customer: { label: 'Customer' },
                staff: { label: 'Staff' },
                partner: { label: 'Partner' },
            },
        }),
        damage_fee: DecimalColumn({
            label: 'Damage Fee ($)',
            default: 0,
        }),
        fee_waived: BooleanColumn({ label: 'Fee Waived', default: false }),
        fee_waived_reason: StringColumn({
            label: 'Waiver Reason',
            maxLength: 1000,
        }),
        incident_notes: StringColumn({
            label: 'Incident Notes',
            maxLength: 4000,
        }),
        photo_url: StringColumn({ label: 'Photo URL', maxLength: 500 }),
    },
})
