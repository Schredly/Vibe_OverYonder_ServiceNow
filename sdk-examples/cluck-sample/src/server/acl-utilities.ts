import { GlideRecord, gs } from '@servicenow/glide'

/**
 * ACL helper scripts. Each exported function returns a boolean and is wired
 * into an ACL's `script` property by the Fluent compiler.
 */

/**
 * Customer can read/write their own orders, subscriptions, etc. Staff+ see all.
 */
export function isStaffOrOwner(current: GlideRecord): boolean {
    if (
        gs.hasRole('x_1939459_cluck.farmhand') ||
        gs.hasRole('x_1939459_cluck.farmer') ||
        gs.hasRole('x_1939459_cluck.admin') ||
        gs.hasRole('admin')
    ) {
        return true
    }
    const opened_by = current.getValue('opened_by')
    return !!opened_by && opened_by === gs.getUserID()
}

/**
 * Customer can write only new records or ones they themselves opened.
 */
export function isSelfOrNew(current: GlideRecord): boolean {
    if (
        gs.hasRole('x_1939459_cluck.farmhand') ||
        gs.hasRole('x_1939459_cluck.farmer') ||
        gs.hasRole('x_1939459_cluck.admin') ||
        gs.hasRole('admin')
    ) {
        return true
    }
    if (current.isNewRecord()) return true
    const opened_by = current.getValue('opened_by')
    return !!opened_by && opened_by === gs.getUserID()
}
