import { BooleanColumn, DecimalColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * Beach-stand location. Inventory is pinned to a location (each stand has
 * its own stock). Also used to render a "where to pick up" map on the portal.
 */
export const x_1939459_shorelin_location = Table({
    name: 'x_1939459_shorelin_location',
    label: 'Beach Stand Location',
    schema: {
        name: StringColumn({ label: 'Stand Name', mandatory: true }),
        address: StringColumn({ label: 'Street Address' }),
        city: StringColumn({ label: 'City' }),
        state: StringColumn({ label: 'State', maxLength: 2 }),
        latitude: DecimalColumn({ label: 'Latitude' }),
        longitude: DecimalColumn({ label: 'Longitude' }),
        phone: StringColumn({ label: 'Phone' }),
        hours: StringColumn({
            label: 'Hours',
            default: '7:00 AM – 7:00 PM',
        }),
        allows_walkup: BooleanColumn({
            label: 'Accepts walk-ups',
            default: true,
        }),
        active: BooleanColumn({
            label: 'Active',
            default: true,
        }),
    },
    display: 'name',
})
