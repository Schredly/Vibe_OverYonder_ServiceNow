import {
    ChoiceColumn,
    DateTimeColumn,
    DecimalColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Maintenance log. Extends `task` so staff can use standard work notes,
 * assignment, and SLA features. One record per maintenance event.
 */
export const x_1939459_shorelin_maintenance_log = Table({
    name: 'x_1939459_shorelin_maintenance_log',
    label: 'Maintenance Log',
    extends: 'task',
    display: 'number',
    auto_number: {
        prefix: 'MAINT',
        number: 100,
        number_of_digits: 7,
    },
    schema: {
        equipment: ReferenceColumn({
            label: 'Equipment',
            referenceTable: 'x_1939459_shorelin_equipment',
            mandatory: true,
        }),
        maintenance_type: ChoiceColumn({
            label: 'Type',
            mandatory: true,
            default: 'inspection',
            choices: {
                inspection: { label: 'Routine Inspection' },
                cleaning: { label: 'Deep Clean' },
                wax: { label: 'Waxing (surf/sup)' },
                repair: { label: 'Repair' },
                tire_service: { label: 'Tire Service (bikes/wagons)' },
                battery: { label: 'Battery Replacement' },
                retire: { label: 'Retire from Fleet' },
            },
        }),
        performed_at: DateTimeColumn({ label: 'Performed At' }),
        performed_by: ReferenceColumn({
            label: 'Performed By',
            referenceTable: 'sys_user',
        }),
        cost: DecimalColumn({ label: 'Cost ($)', default: 0 }),
        resolution_notes: StringColumn({
            label: 'Resolution Notes',
            maxLength: 4000,
        }),
        next_service_due: DateTimeColumn({ label: 'Next Service Due' }),
        condition_after: ChoiceColumn({
            label: 'Condition After',
            default: 'good',
            choices: {
                new: { label: 'New' },
                good: { label: 'Good' },
                fair: { label: 'Fair' },
                needs_maintenance: { label: 'Still Needs Work' },
                retired: { label: 'Retired' },
            },
        }),
    },
})
