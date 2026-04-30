import {
    BooleanColumn,
    ChoiceColumn,
    IntegerColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Breed catalog — the reference list of chicken breeds we raise. Drives
 * breed selection on birds, chick pre-orders, and incubation batches.
 */
export const x_1939459_cluck_breed = Table({
    name: 'x_1939459_cluck_breed',
    label: 'Breed',
    schema: {
        name: StringColumn({ label: 'Breed Name', mandatory: true }),
        purpose: ChoiceColumn({
            label: 'Purpose',
            mandatory: true,
            default: 'layer',
            choices: {
                layer: { label: 'Layer (eggs)' },
                meat: { label: 'Meat' },
                dual: { label: 'Dual-purpose' },
                ornamental: { label: 'Ornamental / exhibition' },
            },
        }),
        avg_eggs_per_year: IntegerColumn({
            label: 'Avg Eggs / Year',
            default: 0,
        }),
        egg_color: ChoiceColumn({
            label: 'Egg Color',
            default: 'brown',
            choices: {
                white: { label: 'White' },
                brown: { label: 'Brown' },
                blue: { label: 'Blue' },
                green: { label: 'Green' },
                cream: { label: 'Cream' },
                speckled: { label: 'Speckled' },
                chocolate: { label: 'Chocolate (dark brown)' },
            },
        }),
        temperament: ChoiceColumn({
            label: 'Temperament',
            default: 'docile',
            choices: {
                docile: { label: 'Docile / friendly' },
                active: { label: 'Active / flighty' },
                broody: { label: 'Broody-prone' },
                aggressive: { label: 'Aggressive' },
            },
        }),
        avg_weight_kg: IntegerColumn({ label: 'Avg Weight (g)', default: 2000 }),
        cold_hardy: BooleanColumn({ label: 'Cold Hardy', default: false }),
        heat_tolerant: BooleanColumn({ label: 'Heat Tolerant', default: false }),
        heritage: BooleanColumn({ label: 'Heritage Breed', default: false }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        image_url: StringColumn({ label: 'Image URL', maxLength: 500 }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'name',
})
