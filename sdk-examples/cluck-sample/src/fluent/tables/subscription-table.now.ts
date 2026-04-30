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
 * Egg CSA subscription. A scheduled job fires weekly/biweekly to auto-create
 * a new `order` record for each active subscription and advance
 * next_fulfillment_date.
 */
export const x_1939459_cluck_subscription = Table({
    name: 'x_1939459_cluck_subscription',
    label: 'CSA Subscription',
    schema: {
        customer: ReferenceColumn({
            label: 'Customer',
            referenceTable: 'x_1939459_cluck_customer',
            mandatory: true,
        }),
        frequency: ChoiceColumn({
            label: 'Frequency',
            mandatory: true,
            default: 'weekly',
            choices: {
                weekly: { label: 'Weekly' },
                biweekly: { label: 'Biweekly' },
                monthly: { label: 'Monthly' },
            },
        }),
        dozen_count: IntegerColumn({
            label: 'Dozens per Delivery',
            mandatory: true,
            default: 1,
        }),
        egg_grade: ChoiceColumn({
            label: 'Egg Grade',
            default: 'large',
            choices: {
                large: { label: 'Large' },
                xlarge: { label: 'X-Large' },
                mixed: { label: 'Mixed (chef\'s choice)' },
            },
        }),
        delivery_mode: ChoiceColumn({
            label: 'Delivery Mode',
            default: 'pickup',
            choices: {
                pickup: { label: 'Pickup at farm' },
                farm_stand: { label: 'Farm stand' },
                delivery: { label: 'Local delivery' },
                market: { label: 'Farmers market' },
            },
        }),
        delivery_day: ChoiceColumn({
            label: 'Delivery Day',
            default: 'saturday',
            choices: {
                sunday: { label: 'Sunday' },
                monday: { label: 'Monday' },
                tuesday: { label: 'Tuesday' },
                wednesday: { label: 'Wednesday' },
                thursday: { label: 'Thursday' },
                friday: { label: 'Friday' },
                saturday: { label: 'Saturday' },
            },
        }),
        start_date: DateColumn({ label: 'Start Date', mandatory: true }),
        next_fulfillment_date: DateColumn({ label: 'Next Fulfillment' }),
        end_date: DateColumn({ label: 'End Date (auto-renew if blank)' }),
        auto_renew: BooleanColumn({ label: 'Auto-renew', default: true }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'active',
            choices: {
                active: { label: 'Active' },
                paused: { label: 'Paused' },
                canceled: { label: 'Canceled' },
                completed: { label: 'Completed' },
            },
        }),
        pause_until: DateColumn({ label: 'Paused Until' }),
        price_per_delivery: DecimalColumn({
            label: 'Price per Delivery ($)',
            default: 0,
        }),
        discount_pct: DecimalColumn({
            label: 'Member Discount %',
            default: 10,
        }),
        deliveries_completed: IntegerColumn({
            label: 'Deliveries Completed',
            default: 0,
        }),
        special_requests: StringColumn({
            label: 'Special Requests',
            maxLength: 2000,
        }),
    },
    display: 'customer',
})
