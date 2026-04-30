import {
    BooleanColumn,
    ChoiceColumn,
    DecimalColumn,
    IntegerColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Lesson catalog — the instructor-led experiences offered alongside gear
 * rentals (surf lessons, SUP yoga, snorkel tours, etc.). The catalog item
 * "Book a Lesson" references this table for the lesson_type variable.
 */
export const x_1939459_shorelin_lesson = Table({
    name: 'x_1939459_shorelin_lesson',
    label: 'Lesson Offering',
    schema: {
        name: StringColumn({ label: 'Lesson Name', mandatory: true }),
        type: ChoiceColumn({
            label: 'Type',
            mandatory: true,
            default: 'surf',
            choices: {
                surf: { label: 'Surf Lesson' },
                sup: { label: 'SUP Lesson' },
                sup_yoga: { label: 'SUP Yoga' },
                snorkel: { label: 'Snorkel Tour' },
                kayak_tour: { label: 'Kayak Tour' },
                beach_photography: { label: 'Beach Photography' },
                sandcastle: { label: 'Sandcastle Workshop' },
            },
        }),
        skill_level: ChoiceColumn({
            label: 'Skill Level',
            default: 'beginner',
            choices: {
                beginner: { label: 'Beginner' },
                intermediate: { label: 'Intermediate' },
                advanced: { label: 'Advanced' },
                all_levels: { label: 'All Levels' },
            },
        }),
        description: StringColumn({ label: 'Description', maxLength: 4000 }),
        duration_minutes: IntegerColumn({
            label: 'Duration (minutes)',
            default: 90,
        }),
        group_size_max: IntegerColumn({
            label: 'Max Group Size',
            default: 6,
        }),
        price_per_person: DecimalColumn({
            label: 'Price per Person ($)',
            mandatory: true,
        }),
        price_private: DecimalColumn({
            label: 'Private Lesson Price ($)',
        }),
        includes_gear: BooleanColumn({
            label: 'Gear Included',
            default: true,
        }),
        active: BooleanColumn({ label: 'Active', default: true }),
    },
    display: 'name',
})
