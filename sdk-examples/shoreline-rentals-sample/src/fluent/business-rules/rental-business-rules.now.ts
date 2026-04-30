import { BusinessRule } from '@servicenow/sdk/core'
import {
    awardLoyaltyPoints,
    calculatePricing,
    onRentalReserved,
    onRentalReturned,
    propagateDamageFee,
} from '../../server/rental-rules'

/**
 * Inventory decrement on new reservation, plus pricing recalculation on every
 * save. `when: 'before'` so we can abort if inventory is short.
 */
BusinessRule({
    $id: Now.ID['br_rental_reserved'],
    name: 'Shoreline - Decrement inventory on new reservation',
    active: true,
    table: 'x_1939459_shorelin_rental_request',
    when: 'before',
    script: onRentalReserved,
})

BusinessRule({
    $id: Now.ID['br_rental_pricing'],
    name: 'Shoreline - Recalculate rental pricing',
    active: true,
    table: 'x_1939459_shorelin_rental_request',
    when: 'before',
    script: calculatePricing,
})

BusinessRule({
    $id: Now.ID['br_rental_returned'],
    name: 'Shoreline - Restore inventory and calc late fee on return',
    active: true,
    table: 'x_1939459_shorelin_rental_request',
    when: 'before',
    script: onRentalReturned,
})

BusinessRule({
    $id: Now.ID['br_rental_loyalty'],
    name: 'Shoreline - Award loyalty points on return',
    active: true,
    table: 'x_1939459_shorelin_rental_request',
    when: 'after',
    script: awardLoyaltyPoints,
})

BusinessRule({
    $id: Now.ID['br_damage_propagate'],
    name: 'Shoreline - Propagate damage fee to rental total',
    active: true,
    table: 'x_1939459_shorelin_damage_report',
    when: 'after',
    script: propagateDamageFee,
})
