import { ClientScript } from '@servicenow/sdk/core'

/**
 * onLoad client script — sets default order_type and fulfillment_status
 * on a new order record opened from the nav bar.
 */
ClientScript({
    $id: Now.ID['cs_order_onload'],
    name: 'Cluck - Order onLoad defaults',
    active: true,
    table: 'x_1939459_cluck_order',
    type: 'onLoad',
    script: `
        function onLoad() {
            if (g_form.isNewRecord()) {
                if (!g_form.getValue('order_type')) {
                    g_form.setValue('order_type', 'eggs');
                }
                if (!g_form.getValue('fulfillment_status')) {
                    g_form.setValue('fulfillment_status', 'pending');
                }
                if (!g_form.getValue('delivery_type')) {
                    g_form.setValue('delivery_type', 'pickup');
                }
            }
        }
    `,
})
