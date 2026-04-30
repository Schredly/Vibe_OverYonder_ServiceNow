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
 * Individual bird. Tag_id is the leg-band or wing-band ID. Not every bird
 * needs a record — named hens (for Adopt-a-Hen), breeders, and birds with
 * special medical history get tracked individually.
 *
 * `adoption_sponsor` references the `customer` table so a hen can be sponsored.
 */
export const x_1939459_cluck_bird = Table({
    name: 'x_1939459_cluck_bird',
    label: 'Bird',
    schema: {
        tag_id: StringColumn({
            label: 'Tag / Band ID',
            mandatory: true,
            maxLength: 40,
        }),
        name: StringColumn({ label: 'Name', maxLength: 80 }),
        breed: ReferenceColumn({
            label: 'Breed',
            referenceTable: 'x_1939459_cluck_breed',
            mandatory: true,
        }),
        flock: ReferenceColumn({
            label: 'Flock',
            referenceTable: 'x_1939459_cluck_flock',
        }),
        sex: ChoiceColumn({
            label: 'Sex',
            mandatory: true,
            default: 'hen',
            choices: {
                hen: { label: 'Hen' },
                rooster: { label: 'Rooster' },
                pullet: { label: 'Pullet (young hen)' },
                cockerel: { label: 'Cockerel (young rooster)' },
                unknown: { label: 'Unknown (chick)' },
            },
        }),
        hatched_date: DateColumn({ label: 'Hatched' }),
        age_days: IntegerColumn({ label: 'Age (days)', default: 0 }),
        weight_grams: IntegerColumn({ label: 'Weight (g)', default: 0 }),
        color_pattern: StringColumn({ label: 'Color / Pattern' }),
        is_breeding_stock: BooleanColumn({
            label: 'Breeding Stock',
            default: false,
        }),
        is_adoptable: BooleanColumn({
            label: 'Available for Adoption',
            default: false,
        }),
        adoption_sponsor: ReferenceColumn({
            label: 'Adoption Sponsor',
            referenceTable: 'x_1939459_cluck_customer',
        }),
        adoption_expires: DateColumn({ label: 'Adoption Expires' }),
        egg_color_observed: StringColumn({ label: 'Observed Egg Color' }),
        lifetime_eggs: IntegerColumn({ label: 'Lifetime Eggs', default: 0 }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'active',
            choices: {
                active: { label: 'Active' },
                molting: { label: 'Molting' },
                brooding: { label: 'Brooding' },
                injured: { label: 'Injured / recovery' },
                retired: { label: 'Retired' },
                deceased: { label: 'Deceased' },
                processed: { label: 'Processed' },
                escaped: { label: 'Escaped' },
            },
        }),
        retired_reason: StringColumn({ label: 'Retired Reason', maxLength: 1000 }),
        photo_url: StringColumn({ label: 'Photo URL', maxLength: 500 }),
        bio: StringColumn({ label: 'Bio / Story', maxLength: 4000 }),
        personality_score: DecimalColumn({
            label: 'Friendliness (1-10)',
            default: 5,
        }),
    },
    display: 'name',
    index: [{ element: 'tag_id', name: 'bird_tag_idx', unique: true }],
})
