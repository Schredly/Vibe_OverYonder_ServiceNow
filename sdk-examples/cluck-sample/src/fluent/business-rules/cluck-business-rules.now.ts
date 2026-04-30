import { BusinessRule } from '@servicenow/sdk/core'
import {
    adjustFlockHeadCount,
    calculateBirdAge,
    calculateOrderTotal,
    checkFeedReorder,
    escalateCriticalIncident,
    onEggLogSave,
    onOrderFulfilled,
} from '../../server/cluck-rules'

BusinessRule({
    $id: Now.ID['br_bird_age'],
    name: 'Cluck - Calculate bird age from hatch date',
    active: true,
    table: 'x_1939459_cluck_bird',
    when: 'before',
    script: calculateBirdAge,
})

BusinessRule({
    $id: Now.ID['br_flock_count'],
    name: 'Cluck - Adjust flock head count when bird status changes',
    active: true,
    table: 'x_1939459_cluck_bird',
    when: 'after',
    script: adjustFlockHeadCount,
})

BusinessRule({
    $id: Now.ID['br_egg_log'],
    name: 'Cluck - Compute egg production rate',
    active: true,
    table: 'x_1939459_cluck_egg_log',
    when: 'before',
    script: onEggLogSave,
})

BusinessRule({
    $id: Now.ID['br_feed_reorder'],
    name: 'Cluck - Auto-open feed reorder task',
    active: true,
    table: 'x_1939459_cluck_feed',
    when: 'after',
    script: checkFeedReorder,
})

BusinessRule({
    $id: Now.ID['br_order_total'],
    name: 'Cluck - Calculate order total',
    active: true,
    table: 'x_1939459_cluck_order',
    when: 'before',
    script: calculateOrderTotal,
})

BusinessRule({
    $id: Now.ID['br_order_fulfilled'],
    name: 'Cluck - Award loyalty eggs on fulfillment',
    active: true,
    table: 'x_1939459_cluck_order',
    when: 'after',
    script: onOrderFulfilled,
})

BusinessRule({
    $id: Now.ID['br_incident_escalate'],
    name: 'Cluck - Escalate critical incidents',
    active: true,
    table: 'x_1939459_cluck_incident',
    when: 'before',
    script: escalateCriticalIncident,
})
