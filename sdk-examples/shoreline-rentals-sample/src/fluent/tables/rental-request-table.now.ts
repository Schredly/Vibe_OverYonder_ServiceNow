import {
    BooleanColumn,
    ChoiceColumn,
    DateTimeColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * The main "rental ticket". Extends `task` to inherit number, state, assignment_group,
 * assigned_to, work_notes, opened_by, opened_at, etc. Works for both catalog-driven
 * online bookings and walk-up rentals created by staff.
 *
 * State flow:
 *   reserved → picked_up → returned   (happy path)
 *              ↓
 *              overdue → returned (late) / lost
 *              ↓
 *              canceled
 */
export const x_1939459_shorelin_rental_request = Table({
    name: 'x_1939459_shorelin_rental_request',
    label: 'Rental Request',
    extends: 'task',
    extensible: true,
    display: 'number',
    auto_number: {
        prefix: 'RENT',
        number: 1001,
        number_of_digits: 7,
    },
    schema: {
        equipment: ReferenceColumn({
            label: 'Equipment',
            referenceTable: 'x_1939459_shorelin_equipment',
        }),
        bundle: ReferenceColumn({
            label: 'Bundle',
            referenceTable: 'x_1939459_shorelin_bundle',
        }),
        member: ReferenceColumn({
            label: 'Member',
            referenceTable: 'x_1939459_shorelin_membership',
        }),
        customer_name: StringColumn({
            label: 'Customer Name',
            mandatory: true,
        }),
        customer_email: StringColumn({ label: 'Customer Email' }),
        customer_phone: StringColumn({ label: 'Customer Phone' }),
        pickup_location: ReferenceColumn({
            label: 'Pickup Location',
            referenceTable: 'x_1939459_shorelin_location',
            mandatory: true,
        }),
        quantity: IntegerColumn({
            label: 'Quantity',
            mandatory: true,
            default: 1,
        }),
        reservation_start: DateTimeColumn({
            label: 'Start',
            mandatory: true,
        }),
        reservation_end: DateTimeColumn({
            label: 'End',
            mandatory: true,
        }),
        actual_pickup: DateTimeColumn({ label: 'Picked Up At' }),
        actual_return: DateTimeColumn({ label: 'Returned At' }),
        rental_status: ChoiceColumn({
            label: 'Rental Status',
            mandatory: true,
            default: 'reserved',
            choices: {
                reserved: { label: 'Reserved', sequence: 1 },
                picked_up: { label: 'Picked Up', sequence: 2 },
                returned: { label: 'Returned', sequence: 3 },
                overdue: { label: 'Overdue', sequence: 4 },
                lost: { label: 'Lost', sequence: 5 },
                canceled: { label: 'Canceled', sequence: 6 },
            },
        }),
        pricing_tier: ChoiceColumn({
            label: 'Pricing Tier',
            default: 'full_day',
            choices: {
                hourly: { label: 'Hourly' },
                half_day: { label: 'Half-Day' },
                full_day: { label: 'Full-Day' },
                weekly: { label: 'Weekly' },
                bundle: { label: 'Bundle' },
            },
        }),
        base_amount: DecimalColumn({ label: 'Base Amount ($)', default: 0 }),
        discount_amount: DecimalColumn({
            label: 'Discount ($)',
            default: 0,
        }),
        deposit_amount: DecimalColumn({
            label: 'Deposit Held ($)',
            default: 0,
        }),
        late_fee: DecimalColumn({ label: 'Late Fee ($)', default: 0 }),
        damage_fee: DecimalColumn({ label: 'Damage Fee ($)', default: 0 }),
        total_amount: DecimalColumn({ label: 'Total ($)', default: 0 }),
        paid: BooleanColumn({ label: 'Paid', default: false }),
        waiver_signed: BooleanColumn({
            label: 'Waiver Signed',
            default: false,
        }),
        weather_cancellation: BooleanColumn({
            label: 'Canceled due to Weather',
            default: false,
        }),
        source: ChoiceColumn({
            label: 'Source',
            default: 'portal',
            choices: {
                portal: { label: 'Service Portal' },
                walkup: { label: 'Walk-up' },
                phone: { label: 'Phone' },
                partner: { label: 'Partner Hotel' },
            },
        }),
        ritm: ReferenceColumn({
            label: 'Originating RITM',
            referenceTable: 'sc_req_item',
        }),
        request_notes: StringColumn({
            label: 'Special Requests',
            maxLength: 4000,
        }),
    },
})
