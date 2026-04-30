import {
    ChoiceColumn,
    DateColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Lost & Found log. Guests leave sunglasses, phones, keys, toys… here.
 * Simple standalone table (not task-based) — it's more of a log than a
 * workflow artifact.
 */
export const x_1939459_shorelin_lost_found = Table({
    name: 'x_1939459_shorelin_lost_found',
    label: 'Lost & Found',
    schema: {
        description: StringColumn({
            label: 'Item Description',
            mandatory: true,
        }),
        category: ChoiceColumn({
            label: 'Category',
            default: 'personal',
            choices: {
                personal: { label: 'Personal Item' },
                apparel: { label: 'Apparel' },
                electronics: { label: 'Electronics' },
                kids: { label: "Kids' Item" },
                keys: { label: 'Keys / Wallet' },
                jewelry: { label: 'Jewelry' },
                other: { label: 'Other' },
            },
        }),
        found_at_location: ReferenceColumn({
            label: 'Found at Location',
            referenceTable: 'x_1939459_shorelin_location',
        }),
        found_on: DateColumn({ label: 'Found On', mandatory: true }),
        found_by: ReferenceColumn({
            label: 'Found By',
            referenceTable: 'sys_user',
        }),
        storage_bin: StringColumn({ label: 'Storage Bin #', maxLength: 20 }),
        status: ChoiceColumn({
            label: 'Status',
            mandatory: true,
            default: 'awaiting',
            choices: {
                awaiting: { label: 'Awaiting Owner' },
                claimed: { label: 'Claimed' },
                donated: { label: 'Donated' },
                disposed: { label: 'Disposed' },
            },
        }),
        claimant_name: StringColumn({ label: 'Claimant Name' }),
        claimant_contact: StringColumn({ label: 'Claimant Contact' }),
        claimed_on: DateColumn({ label: 'Claimed On' }),
        notes: StringColumn({ label: 'Notes', maxLength: 4000 }),
    },
    display: 'description',
})
