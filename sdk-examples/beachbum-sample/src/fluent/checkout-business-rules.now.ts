import { BusinessRule } from '@servicenow/sdk/core'
import { onCheckoutCreated, onCheckoutReturned } from '../server/checkout-rules'

/**
 * Reduce available equipment quantity when a checkout is created
 */
BusinessRule({
    $id: Now.ID['br_checkout_created'],
    name: 'Beach Bum - Reduce Inventory on Checkout',
    active: true,
    table: 'x_beachbum_checkout',
    when: 'before',
    script: onCheckoutCreated,
})

/**
 * Restore available equipment quantity when a checkout is returned
 */
BusinessRule({
    $id: Now.ID['br_checkout_returned'],
    name: 'Beach Bum - Restore Inventory on Return',
    active: true,
    table: 'x_beachbum_checkout',
    when: 'before',
    script: onCheckoutReturned,
})
