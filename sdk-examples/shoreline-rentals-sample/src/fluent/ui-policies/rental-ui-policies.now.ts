import { UiPolicy } from '@servicenow/sdk/core'

/**
 * When rental_status = overdue, make late_fee editable and required so staff
 * can document the late return before marking it closed.
 */
UiPolicy({
    $id: Now.ID['up_overdue_latefee_required'],
    table: 'x_1939459_shorelin_rental_request',
    shortDescription:
        'Shoreline - Late fee required on overdue rentals',
    onLoad: true,
    reverseIfFalse: true,
    runScripts: false,
    conditions: 'rental_status=overdue',
    actions: [
        { field: 'late_fee', mandatory: true, readOnly: false, visible: true },
    ],
})

/**
 * When the equipment is weather_sensitive and the weather_cancellation toggle
 * is on, hide deposit/late_fee/damage_fee (customer gets full refund).
 */
UiPolicy({
    $id: Now.ID['up_weather_refund'],
    table: 'x_1939459_shorelin_rental_request',
    shortDescription: 'Shoreline - Weather cancellation waives fees',
    onLoad: true,
    reverseIfFalse: true,
    runScripts: false,
    conditions: 'weather_cancellation=true',
    actions: [
        { field: 'late_fee', mandatory: false, readOnly: true, visible: false },
        { field: 'damage_fee', mandatory: false, readOnly: true, visible: false },
        { field: 'deposit_amount', mandatory: false, readOnly: true, visible: false },
    ],
})
