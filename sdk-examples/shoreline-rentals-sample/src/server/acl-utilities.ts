import { GlideRecord, gs } from '@servicenow/glide'

/**
 * Script-based ACL helpers. Referenced by ACL declarations so that a single
 * source of truth controls "can this user see/write this record?" logic.
 */

export function isSelf(current: GlideRecord): boolean {
    const openedBy = current.getValue('opened_by')
    const createdBy = current.getValue('sys_created_by')
    const currentUser = gs.getUserID()
    const currentUserName = gs.getUserName()
    return openedBy === currentUser || createdBy === currentUserName
}

export function isSelfOrNew(current: GlideRecord): boolean {
    if (current.isNewRecord()) return true
    return isSelf(current)
}

export function isStaffOrOwner(current: GlideRecord): boolean {
    if (gs.hasRole('x_1939459_shorelin.staff')) return true
    return isSelf(current)
}
