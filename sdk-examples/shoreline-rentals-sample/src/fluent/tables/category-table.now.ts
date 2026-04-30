import { ChoiceColumn, IntegerColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * Equipment category — lets admins group inventory and color-code the portal.
 * Having a real table (vs a choice field) means new categories don't need a
 * code deploy.
 */
export const x_1939459_shorelin_category = Table({
    name: 'x_1939459_shorelin_category',
    label: 'Rental Category',
    schema: {
        name: StringColumn({ label: 'Category Name', mandatory: true }),
        short_code: StringColumn({
            label: 'Short Code',
            mandatory: true,
            maxLength: 20,
        }),
        description: StringColumn({ label: 'Description' }),
        icon: StringColumn({
            label: 'Icon',
            maxLength: 60,
            choices: {
                'umbrella-beach': { label: 'umbrella-beach' },
                surfboard: { label: 'surfboard' },
                tent: { label: 'tent' },
                campground: { label: 'campground' },
                bicycle: { label: 'bicycle' },
                camera: { label: 'camera' },
                speaker: { label: 'speaker' },
                toys: { label: 'toys' },
            },
        }),
        color_hex: StringColumn({
            label: 'Portal Color',
            maxLength: 7,
            default: '#00a6c0',
        }),
        age_restriction: ChoiceColumn({
            label: 'Age Restriction',
            default: 'none',
            choices: {
                none: { label: 'None' },
                adult_only: { label: '18+' },
                supervised_minor: { label: 'Minor with adult' },
            },
        }),
        sort_order: IntegerColumn({ label: 'Sort Order', default: 100 }),
    },
    display: 'name',
})
