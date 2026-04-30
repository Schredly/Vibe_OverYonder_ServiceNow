import {
    ChoiceColumn,
    DateColumn,
    DecimalColumn,
    IntegerColumn,
    ReferenceColumn,
    StringColumn,
    Table,
} from '@servicenow/sdk/core'

/**
 * Daily egg collection log. One row per flock per day. Farmhand logs counts
 * when collecting; FlockAnalytics rolls up weekly/monthly stats.
 *
 * Grade counts sum to count_collected minus cracked/soft-shell.
 */
export const x_1939459_cluck_egg_log = Table({
    name: 'x_1939459_cluck_egg_log',
    label: 'Egg Log',
    schema: {
        log_date: DateColumn({ label: 'Collection Date', mandatory: true }),
        flock: ReferenceColumn({
            label: 'Flock',
            referenceTable: 'x_1939459_cluck_flock',
            mandatory: true,
        }),
        coop: ReferenceColumn({
            label: 'Coop',
            referenceTable: 'x_1939459_cluck_coop',
        }),
        count_collected: IntegerColumn({
            label: 'Total Collected',
            mandatory: true,
            default: 0,
        }),
        count_jumbo: IntegerColumn({ label: 'Jumbo', default: 0 }),
        count_xlarge: IntegerColumn({ label: 'X-Large', default: 0 }),
        count_large: IntegerColumn({ label: 'Large', default: 0 }),
        count_medium: IntegerColumn({ label: 'Medium', default: 0 }),
        count_small: IntegerColumn({ label: 'Small / Pullet', default: 0 }),
        count_cracked: IntegerColumn({ label: 'Cracked (discard)', default: 0 }),
        count_soft_shell: IntegerColumn({
            label: 'Soft-Shell (feed back)',
            default: 0,
        }),
        count_double_yolk: IntegerColumn({ label: 'Double Yolk (bonus!)', default: 0 }),
        time_of_day: ChoiceColumn({
            label: 'Collection Time',
            default: 'morning',
            choices: {
                morning: { label: 'Morning' },
                afternoon: { label: 'Afternoon' },
                evening: { label: 'Evening' },
            },
        }),
        avg_weight_g: DecimalColumn({ label: 'Avg Weight (g)', default: 0 }),
        collector: ReferenceColumn({
            label: 'Collected By',
            referenceTable: 'sys_user',
        }),
        weather_notes: StringColumn({ label: 'Weather / Notes', maxLength: 1000 }),
        production_rate_pct: DecimalColumn({
            label: 'Production Rate %',
            default: 0,
        }),
    },
    display: 'log_date',
})
