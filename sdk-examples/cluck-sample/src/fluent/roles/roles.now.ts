import { Role } from '@servicenow/sdk/core'

/**
 * Cluckworks role hierarchy
 *   customer  — end users buying eggs, subscriptions, adoptions
 *   farmhand  — daily-ops staff: log eggs, feed birds, record weights, triage incidents
 *   farmer    — operators: breeding decisions, pricing, health records
 *   admin     — configures breeds, coops, catalog pricing, sponsorship tiers
 */

export const cluckCustomer = Role({
    name: 'x_1939459_cluck.customer',
    description: 'Cluckworks end user / egg customer',
})

export const cluckFarmhand = Role({
    name: 'x_1939459_cluck.farmhand',
    description: 'Daily-ops farmhand: egg collection, feeding, routine bird care',
    containsRoles: [cluckCustomer],
})

export const cluckFarmer = Role({
    name: 'x_1939459_cluck.farmer',
    description: 'Farm operator: breeding, health, pricing decisions',
    containsRoles: [cluckFarmhand],
})

export const cluckAdmin = Role({
    name: 'x_1939459_cluck.admin',
    description: 'Cluckworks application administrator',
    containsRoles: [cluckFarmer],
    grantable: true,
})
