import { Role } from '@servicenow/sdk/core'

/**
 * Shoreline role hierarchy
 *   customer  — end users browsing the catalog / managing their own rentals
 *   staff     — beach-stand employees who check items in/out, log damage
 *   admin     — managers who configure inventory, bundles, memberships, and locations
 *
 * `containsRoles` makes admin inherit staff inherit customer, so a user with
 * `x_1939459_shorelin.admin` can do everything without separate role grants.
 */

export const shorelineCustomer = Role({
    name: 'x_1939459_shorelin.customer',
    description: 'Shoreline Rentals end user / guest',
})

export const shorelineStaff = Role({
    name: 'x_1939459_shorelin.staff',
    description: 'Beach-stand staff who process walkups and returns',
    containsRoles: [shorelineCustomer],
})

export const shorelineAdmin = Role({
    name: 'x_1939459_shorelin.admin',
    description: 'Shoreline Rentals application administrator',
    containsRoles: [shorelineStaff],
    grantable: true,
})
