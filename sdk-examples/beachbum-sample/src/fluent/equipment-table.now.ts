import { ChoiceColumn, IntegerColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * Beach Equipment inventory table
 * Tracks all available beach equipment and current stock levels
 */
export const x_beachbum_equipment = Table({
    name: 'x_beachbum_equipment',
    label: 'Beach Equipment',
    schema: {
        name: StringColumn({ label: 'Equipment Name', mandatory: true }),
        type: ChoiceColumn({
            label: 'Equipment Type',
            mandatory: true,
            choices: {
                chair: { label: 'Beach Chair' },
                umbrella: { label: 'Umbrella' },
                boogie_board: { label: 'Boogie Board' },
                surfboard: { label: 'Surfboard' },
                towel: { label: 'Towel' },
                cooler: { label: 'Cooler' },
                snorkel_set: { label: 'Snorkel Set' },
            },
        }),
        total_quantity: IntegerColumn({ label: 'Total Quantity', mandatory: true }),
        available_quantity: IntegerColumn({ label: 'Available Quantity', mandatory: true }),
        condition: ChoiceColumn({
            label: 'Condition',
            choices: {
                new: { label: 'New' },
                good: { label: 'Good' },
                fair: { label: 'Fair' },
                poor: { label: 'Poor' },
                retired: { label: 'Retired' },
            },
        }),
        daily_rate: StringColumn({ label: 'Daily Rate ($)' }),
        description: StringColumn({ label: 'Description' }),
    },
})
