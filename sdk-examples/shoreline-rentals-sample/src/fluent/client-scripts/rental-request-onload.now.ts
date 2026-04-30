import { ClientScript } from '@servicenow/sdk/core'

/**
 * onLoad script — defaults rental window dates and toggles read-only state
 * for pickup/return timestamps based on the rental_status.
 */
export default ClientScript({
    $id: Now.ID['cs_rental_request_onload'],
    type: 'onLoad',
    ui_type: 'all',
    table: 'x_1939459_shorelin_rental_request',
    name: 'Shoreline - Rental Request onLoad defaults',
    active: true,
    applies_extended: false,
    description:
        'Sets default reservation window and read-only behavior for timestamps',
    isolate_script: false,
    script: Now.include('./rental-request-onload.client.js'),
})
