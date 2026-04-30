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
 * Membership roster. One record per member. Tier controls discounts and
 * priority booking; loyalty_points accumulate and are spendable.
 *
 * `user` references sys_user when the customer has a portal account; for
 * walkup members we just capture name/email/phone.
 */
export const x_1939459_shorelin_membership = Table({
    name: 'x_1939459_shorelin_membership',
    label: 'Member',
    schema: {
        member_number: StringColumn({
            label: 'Member #',
            maxLength: 20,
        }),
        user: ReferenceColumn({
            label: 'User',
            referenceTable: 'sys_user',
        }),
        full_name: StringColumn({ label: 'Full Name', mandatory: true }),
        email: StringColumn({ label: 'Email' }),
        phone: StringColumn({ label: 'Phone' }),
        tier: ChoiceColumn({
            label: 'Tier',
            mandatory: true,
            default: 'beachcomber',
            choices: {
                beachcomber: { label: 'Beachcomber (free)' },
                sun_chaser: { label: 'Sun Chaser (10% off)' },
                wave_rider: { label: 'Wave Rider VIP (20% off + priority)' },
            },
        }),
        discount_percent: IntegerColumn({
            label: 'Discount %',
            default: 0,
        }),
        loyalty_points: IntegerColumn({
            label: 'Loyalty Points',
            default: 0,
        }),
        lifetime_spend: DecimalColumn({
            label: 'Lifetime Spend ($)',
            default: 0,
        }),
        joined_on: DateColumn({ label: 'Joined On' }),
        expires_on: DateColumn({ label: 'Tier Expires On' }),
        waiver_on_file: BooleanColumn({
            label: 'Waiver on File',
            default: false,
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'full_name',
})
