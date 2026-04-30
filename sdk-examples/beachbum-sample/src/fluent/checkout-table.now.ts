import {
    ChoiceColumn,
    DateTimeColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Equipment Checkout table
 * Tracks who checked out what equipment and when
 */
export const x_beachbum_checkout = Table({
    name: 'x_beachbum_checkout',
    label: 'Equipment Checkout',
    schema: {
        equipment: ReferenceColumn({
            label: 'Equipment',
            mandatory: true,
            referenceTable: 'x_beachbum_equipment',
        }),
        customer_name: StringColumn({ label: 'Customer Name', mandatory: true }),
        customer_phone: StringColumn({ label: 'Customer Phone' }),
        customer_email: StringColumn({ label: 'Customer Email' }),
        quantity: IntegerColumn({ label: 'Quantity', mandatory: true }),
        checkout_date: DateTimeColumn({ label: 'Checkout Date', mandatory: true }),
        expected_return: DateTimeColumn({ label: 'Expected Return', mandatory: true }),
        actual_return: DateTimeColumn({ label: 'Actual Return' }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            choices: {
                checked_out: { label: 'Checked Out' },
                returned: { label: 'Returned' },
                overdue: { label: 'Overdue' },
                lost: { label: 'Lost' },
            },
        }),
        notes: StringColumn({ label: 'Notes' }),
        deposit_collected: StringColumn({ label: 'Deposit Collected ($)' }),
    },
})
