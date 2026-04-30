import { Acl } from '@servicenow/sdk/core'
import { shorelineAdmin, shorelineCustomer, shorelineStaff } from '../roles/roles.now'
import { isSelfOrNew, isStaffOrOwner } from '../../server/acl-utilities'

/**
 * Access control matrix
 *
 *                       | customer | staff | admin |
 *   equipment  read     |    Y     |   Y   |   Y   |
 *   equipment  write    |          |   Y   |   Y   |
 *   equipment  create   |          |       |   Y   |
 *   equipment  delete   |          |       |   Y   |
 *   request    read     | own only |   Y   |   Y   |
 *   request    write    | own+new  |   Y   |   Y   |
 *   request    create   |    Y     |   Y   |   Y   |
 *   damage     create   |    Y     |   Y   |   Y   | (customers report, staff triage)
 *   maintenance write   |          |   Y   |   Y   |
 *   location/bundle/mem | read all | read  |  CRUD |
 */

// ---------- Equipment ----------
Acl({
    $id: Now.ID['acl_equipment_read'],
    type: 'record',
    operation: 'read',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_equipment',
})
Acl({
    $id: Now.ID['acl_equipment_write'],
    type: 'record',
    operation: 'write',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_equipment',
})
Acl({
    $id: Now.ID['acl_equipment_create'],
    type: 'record',
    operation: 'create',
    roles: [shorelineAdmin],
    table: 'x_1939459_shorelin_equipment',
})
Acl({
    $id: Now.ID['acl_equipment_delete'],
    type: 'record',
    operation: 'delete',
    roles: [shorelineAdmin],
    table: 'x_1939459_shorelin_equipment',
})

// ---------- Rental Request (extends task) ----------
Acl({
    $id: Now.ID['acl_request_read'],
    type: 'record',
    operation: 'read',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_rental_request',
    script: isStaffOrOwner,
})
Acl({
    $id: Now.ID['acl_request_write'],
    type: 'record',
    operation: 'write',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_rental_request',
    script: isSelfOrNew,
})
Acl({
    $id: Now.ID['acl_request_write_staff'],
    type: 'record',
    operation: 'write',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_rental_request',
})
Acl({
    $id: Now.ID['acl_request_create'],
    type: 'record',
    operation: 'create',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_rental_request',
})
Acl({
    $id: Now.ID['acl_request_delete'],
    type: 'record',
    operation: 'delete',
    roles: [shorelineAdmin],
    table: 'x_1939459_shorelin_rental_request',
})

// ---------- Damage Report ----------
Acl({
    $id: Now.ID['acl_damage_create'],
    type: 'record',
    operation: 'create',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_damage_report',
})
Acl({
    $id: Now.ID['acl_damage_read'],
    type: 'record',
    operation: 'read',
    roles: [shorelineCustomer],
    table: 'x_1939459_shorelin_damage_report',
    script: isStaffOrOwner,
})
Acl({
    $id: Now.ID['acl_damage_write'],
    type: 'record',
    operation: 'write',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_damage_report',
})

// ---------- Maintenance Log (staff/admin only) ----------
Acl({
    $id: Now.ID['acl_maintenance_read'],
    type: 'record',
    operation: 'read',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_maintenance_log',
})
Acl({
    $id: Now.ID['acl_maintenance_write'],
    type: 'record',
    operation: 'write',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_maintenance_log',
})
Acl({
    $id: Now.ID['acl_maintenance_create'],
    type: 'record',
    operation: 'create',
    roles: [shorelineStaff],
    table: 'x_1939459_shorelin_maintenance_log',
})

// ---------- Lookup tables (read to all, write to admin) ----------
// Fluent files can't use for-of loops, so the ACLs are unrolled.

// Category
Acl({ $id: Now.ID['acl_category_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_category' })
Acl({ $id: Now.ID['acl_category_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_category' })
Acl({ $id: Now.ID['acl_category_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_category' })

// Location
Acl({ $id: Now.ID['acl_location_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_location' })
Acl({ $id: Now.ID['acl_location_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_location' })
Acl({ $id: Now.ID['acl_location_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_location' })

// Bundle
Acl({ $id: Now.ID['acl_bundle_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_bundle' })
Acl({ $id: Now.ID['acl_bundle_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_bundle' })
Acl({ $id: Now.ID['acl_bundle_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_bundle' })

// Membership
Acl({ $id: Now.ID['acl_membership_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_membership' })
Acl({ $id: Now.ID['acl_membership_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_membership' })
Acl({ $id: Now.ID['acl_membership_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_membership' })

// Lost & Found
Acl({ $id: Now.ID['acl_lostfound_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_lost_found' })
Acl({ $id: Now.ID['acl_lostfound_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_lost_found' })
Acl({ $id: Now.ID['acl_lostfound_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_lost_found' })

// Lesson
Acl({ $id: Now.ID['acl_lesson_read'],   type: 'record', operation: 'read',   roles: [shorelineCustomer], table: 'x_1939459_shorelin_lesson' })
Acl({ $id: Now.ID['acl_lesson_write'],  type: 'record', operation: 'write',  roles: [shorelineAdmin],    table: 'x_1939459_shorelin_lesson' })
Acl({ $id: Now.ID['acl_lesson_create'], type: 'record', operation: 'create', roles: [shorelineAdmin],    table: 'x_1939459_shorelin_lesson' })

// ---------- Scripted REST endpoint ----------
Acl({
    $id: Now.ID['acl_rest_availability'],
    name: 'shoreline_availability',
    type: 'rest_endpoint',
    operation: 'execute',
    roles: [shorelineCustomer],
})
