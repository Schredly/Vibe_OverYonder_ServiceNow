import { UiAction } from '@servicenow/sdk/core'

/**
 * "Mark Returned" UI action on the rental request form. One click sets
 * rental_status=returned and stamps actual_return = now. The business rule
 * picks it up from there to calculate the late fee and restore inventory.
 */
UiAction({
    $id: Now.ID['ua_mark_returned'],
    table: 'x_1939459_shorelin_rental_request',
    actionName: 'mark_returned',
    name: 'Mark Returned',
    active: true,
    showUpdate: true,
    showInsert: false,
    hint: 'Flag this rental as returned. Late fees will auto-calculate.',
    condition:
        "current.rental_status == 'picked_up' || current.rental_status == 'overdue'",
    form: {
        showButton: true,
        showLink: false,
        showContextMenu: true,
        style: 'primary',
    },
    list: {
        showButton: true,
        showLink: false,
        showContextMenu: true,
        showListChoice: true,
        showSaveWithFormButton: false,
        style: 'primary',
    },
    script: `
        current.rental_status = 'returned';
        if (!current.actual_return) {
            current.actual_return = new GlideDateTime().getValue();
        }
        current.update();
        gs.addInfoMessage('Rental ' + current.number + ' marked returned.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_shorelin.staff'],
    order: 100,
})

/**
 * "Cancel - Weather" UI action: sets status canceled, stamps the weather flag
 * to trigger a refund later.
 */
UiAction({
    $id: Now.ID['ua_cancel_weather'],
    table: 'x_1939459_shorelin_rental_request',
    actionName: 'cancel_weather',
    name: 'Cancel (Weather)',
    active: true,
    showUpdate: true,
    hint: 'Cancel this rental due to weather; full refund issued.',
    condition:
        "current.rental_status == 'reserved' && current.equipment.weather_sensitive == 'true'",
    form: { showButton: true, style: 'destructive' },
    list: { showListChoice: true, style: 'destructive' },
    script: `
        current.rental_status = 'canceled';
        current.weather_cancellation = true;
        current.update();
        gs.addInfoMessage('Rental ' + current.number + ' canceled (weather). Refund pending.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_shorelin.staff'],
    order: 200,
})
