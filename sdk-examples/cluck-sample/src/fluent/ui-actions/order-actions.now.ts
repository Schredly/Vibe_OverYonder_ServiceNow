import { UiAction } from '@servicenow/sdk/core'

/**
 * "Mark Delivered" — single click to fulfill. Loyalty eggs auto-award in the BR.
 */
UiAction({
    $id: Now.ID['ua_mark_delivered'],
    table: 'x_1939459_cluck_order',
    actionName: 'mark_delivered',
    name: 'Mark Delivered',
    active: true,
    showUpdate: true,
    showInsert: false,
    hint: 'Mark this order as delivered. Loyalty eggs auto-awarded.',
    condition:
        "current.fulfillment_status == 'pending' || current.fulfillment_status == 'ready' || current.fulfillment_status == 'out_for_delivery'",
    form: {
        showButton: true,
        showContextMenu: true,
        style: 'primary',
    },
    list: {
        showButton: true,
        showListChoice: true,
        style: 'primary',
    },
    script: `
        current.fulfillment_status = 'delivered';
        current.paid = true;
        current.update();
        gs.addInfoMessage('Order ' + current.number + ' delivered.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_cluck.farmhand'],
    order: 100,
})

/**
 * "Mark Picked Up" — counterpart for pickup orders.
 */
UiAction({
    $id: Now.ID['ua_mark_picked_up'],
    table: 'x_1939459_cluck_order',
    actionName: 'mark_picked_up',
    name: 'Mark Picked Up',
    active: true,
    showUpdate: true,
    hint: 'Customer picked up their order.',
    condition:
        "(current.delivery_type == 'pickup' || current.delivery_type == 'farm_stand') && current.fulfillment_status != 'picked_up'",
    form: { showButton: true, style: 'primary' },
    list: { showListChoice: true, style: 'primary' },
    script: `
        current.fulfillment_status = 'picked_up';
        current.paid = true;
        current.update();
        gs.addInfoMessage('Order ' + current.number + ' picked up.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_cluck.farmhand'],
    order: 200,
})
