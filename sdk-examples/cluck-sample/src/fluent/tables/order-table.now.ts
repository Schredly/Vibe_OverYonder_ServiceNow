import {
    BooleanColumn,
    ChoiceColumn,
    DateColumn,
    DateTimeColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Customer order — eggs, chicks, tour bookings, adoptions. Extends task for
 * number, state, assignment, opened_by. Pricing recalc is in a before-save BR.
 */
export const x_1939459_cluck_order = Table({
    name: 'x_1939459_cluck_order',
    label: 'Order',
    extends: 'task',
    extensible: true,
    display: 'number',
    auto_number: {
        prefix: 'EGG',
        number: 1001,
        number_of_digits: 7,
    },
    schema: {
        customer: ReferenceColumn({
            label: 'Customer',
            referenceTable: 'x_1939459_cluck_customer',
        }),
        customer_name: StringColumn({ label: 'Customer Name', mandatory: true }),
        customer_email: StringColumn({ label: 'Email' }),
        customer_phone: StringColumn({ label: 'Phone' }),
        order_type: ChoiceColumn({
            label: 'Order Type',
            mandatory: true,
            default: 'eggs',
            choices: {
                eggs: { label: 'Fresh eggs' },
                csa: { label: 'CSA subscription' },
                chicks: { label: 'Chick pre-order' },
                tour: { label: 'Farm tour' },
                adoption: { label: 'Adopt-a-Hen' },
                other: { label: 'Other' },
            },
        }),
        egg_grade: ChoiceColumn({
            label: 'Egg Grade',
            default: 'large',
            choices: {
                jumbo: { label: 'Jumbo' },
                xlarge: { label: 'X-Large' },
                large: { label: 'Large' },
                medium: { label: 'Medium' },
                mixed: { label: 'Mixed basket' },
            },
        }),
        egg_dozens: IntegerColumn({ label: 'Dozens', default: 0 }),
        chick_breed: ReferenceColumn({
            label: 'Chick Breed',
            referenceTable: 'x_1939459_cluck_breed',
        }),
        chick_quantity: IntegerColumn({ label: 'Chick Quantity', default: 0 }),
        target_hatch_batch: ReferenceColumn({
            label: 'Target Incubation Batch',
            referenceTable: 'x_1939459_cluck_incubation',
        }),
        adopted_hen: ReferenceColumn({
            label: 'Adopted Hen',
            referenceTable: 'x_1939459_cluck_bird',
        }),
        tour_date: DateTimeColumn({ label: 'Tour Date / Time' }),
        tour_party_size: IntegerColumn({ label: 'Tour Party Size', default: 1 }),
        tour_add_egg_hunt: BooleanColumn({
            label: 'Add egg-gathering experience',
            default: false,
        }),
        delivery_type: ChoiceColumn({
            label: 'Delivery Type',
            mandatory: true,
            default: 'pickup',
            choices: {
                pickup: { label: 'Pickup at farm' },
                farm_stand: { label: 'Farm stand (self-serve)' },
                local_delivery: { label: 'Local delivery' },
                farmers_market: { label: 'Farmers market hand-off' },
            },
        }),
        delivery_address: StringColumn({ label: 'Delivery Address', maxLength: 1000 }),
        delivery_date: DateColumn({ label: 'Delivery / Pickup Date' }),
        fulfillment_status: ChoiceColumn({
            label: 'Fulfillment',
            mandatory: true,
            default: 'pending',
            choices: {
                pending: { label: 'Pending' },
                ready: { label: 'Ready' },
                out_for_delivery: { label: 'Out for delivery' },
                delivered: { label: 'Delivered' },
                picked_up: { label: 'Picked up' },
                no_show: { label: 'No-show' },
                canceled: { label: 'Canceled' },
            },
        }),
        subtotal: DecimalColumn({ label: 'Subtotal ($)', default: 0 }),
        delivery_fee: DecimalColumn({ label: 'Delivery Fee ($)', default: 0 }),
        discount: DecimalColumn({ label: 'Discount ($)', default: 0 }),
        total: DecimalColumn({ label: 'Total ($)', default: 0 }),
        paid: BooleanColumn({ label: 'Paid', default: false }),
        loyalty_earned: IntegerColumn({ label: 'Loyalty Eggs Earned', default: 0 }),
        ritm: ReferenceColumn({
            label: 'Originating RITM',
            referenceTable: 'sc_req_item',
        }),
        special_requests: StringColumn({
            label: 'Special Requests',
            maxLength: 4000,
        }),
    },
})
