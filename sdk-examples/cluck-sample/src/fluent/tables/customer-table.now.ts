import {
    BooleanColumn,
    ChoiceColumn,
    DateColumn,
    DecimalColumn,
    IntegerColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Egg customer / farm patron. Tracks lifetime spend, loyalty eggs (points),
 * tier, and contact preferences. Sponsors for Adopt-a-Hen are flagged here.
 */
export const x_1939459_cluck_customer = Table({
    name: 'x_1939459_cluck_customer',
    label: 'Customer',
    schema: {
        name: StringColumn({ label: 'Full Name', mandatory: true }),
        email: StringColumn({ label: 'Email', mandatory: true }),
        phone: StringColumn({ label: 'Phone' }),
        street: StringColumn({ label: 'Street' }),
        city: StringColumn({ label: 'City' }),
        state: StringColumn({ label: 'State', maxLength: 40 }),
        postal_code: StringColumn({ label: 'Postal Code', maxLength: 20 }),
        tier: ChoiceColumn({
            label: 'Tier',
            mandatory: true,
            default: 'regular',
            choices: {
                regular: { label: 'Regular' },
                csa: { label: 'CSA subscriber' },
                sponsor: { label: 'Hen sponsor' },
                wholesale: { label: 'Wholesale / restaurant' },
                vip: { label: 'VIP / farm friend' },
            },
        }),
        preferred_contact: ChoiceColumn({
            label: 'Preferred Contact',
            default: 'email',
            choices: {
                email: { label: 'Email' },
                sms: { label: 'Text message' },
                phone: { label: 'Phone call' },
                none: { label: 'Do not contact' },
            },
        }),
        allows_marketing: BooleanColumn({
            label: 'Opt-in to Marketing',
            default: true,
        }),
        lifetime_spend: DecimalColumn({ label: 'Lifetime Spend ($)', default: 0 }),
        loyalty_eggs: IntegerColumn({
            label: 'Loyalty Eggs (1 = $0.10)',
            default: 0,
        }),
        first_order_date: DateColumn({ label: 'First Order' }),
        last_order_date: DateColumn({ label: 'Last Order' }),
        sponsored_hens_count: IntegerColumn({
            label: 'Sponsored Hens',
            default: 0,
        }),
        notes: StringColumn({ label: 'Notes', maxLength: 2000 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'name',
    index: [{ element: 'email', name: 'customer_email_idx', unique: true }],
})
