import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { shorelineStaff } from '../roles/roles.now'

/**
 * Application category + menu — lands the nav items in a "Shoreline" section
 * of the left-hand sidebar for admins and staff.
 */

export const shorelineCategory = Record({
    $id: Now.ID['app_cat_shoreline'],
    table: 'sys_app_category',
    data: {
        name: 'Shoreline',
        style: 'border: 1px solid #00a6c0; background-color: #e8f6f8;',
        default_order: 100,
    },
})

export const shorelineAppMenu = ApplicationMenu({
    $id: Now.ID['app_menu_shoreline'],
    title: 'Shoreline Beach Rentals',
    hint: 'Inventory, rentals, memberships, and operations',
    description:
        'Administer the Shoreline Beach Rentals scoped app — inventory, reservations, maintenance, damage, and loyalty.',
    category: shorelineCategory,
    active: true,
    roles: [shorelineStaff],
})

// ---------- Inventory modules ----------
Record({
    $id: Now.ID['mod_all_equipment'],
    table: 'sys_app_module',
    data: {
        title: 'All Equipment',
        application: shorelineAppMenu,
        order: 100,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_equipment',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_featured_equipment'],
    table: 'sys_app_module',
    data: {
        title: 'Featured Equipment',
        application: shorelineAppMenu,
        order: 110,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_equipment',
        filter: 'featured=true^active=true',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_new_equipment'],
    table: 'sys_app_module',
    data: {
        title: 'Add Equipment',
        application: shorelineAppMenu,
        order: 120,
        link_type: 'NEW',
        name: 'x_1939459_shorelin_equipment',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_needs_maintenance'],
    table: 'sys_app_module',
    data: {
        title: 'Needs Maintenance',
        application: shorelineAppMenu,
        order: 130,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_equipment',
        filter: 'condition=needs_maintenance',
        active: true,
    },
})

// ---------- Rental request modules ----------
Record({
    $id: Now.ID['mod_all_rentals'],
    table: 'sys_app_module',
    data: {
        title: 'All Rentals',
        application: shorelineAppMenu,
        order: 200,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_rental_request',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_active_rentals'],
    table: 'sys_app_module',
    data: {
        title: 'Active Rentals',
        application: shorelineAppMenu,
        order: 210,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_rental_request',
        filter: 'rental_statusINreserved,picked_up',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_overdue_rentals'],
    table: 'sys_app_module',
    data: {
        title: 'Overdue Returns',
        application: shorelineAppMenu,
        order: 220,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_rental_request',
        filter: 'rental_status=overdue',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_today_rentals'],
    table: 'sys_app_module',
    data: {
        title: "Today's Pickups",
        application: shorelineAppMenu,
        order: 230,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_rental_request',
        filter:
            'rental_status=reserved^reservation_startONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_new_rental'],
    table: 'sys_app_module',
    data: {
        title: 'New Walk-up Rental',
        application: shorelineAppMenu,
        order: 240,
        link_type: 'NEW',
        name: 'x_1939459_shorelin_rental_request',
        active: true,
    },
})

// ---------- Operations modules (staff) ----------
Record({
    $id: Now.ID['mod_damage_reports'],
    table: 'sys_app_module',
    data: {
        title: 'Damage Reports',
        application: shorelineAppMenu,
        order: 300,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_damage_report',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_maintenance_log'],
    table: 'sys_app_module',
    data: {
        title: 'Maintenance Log',
        application: shorelineAppMenu,
        order: 310,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_maintenance_log',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_lost_found'],
    table: 'sys_app_module',
    data: {
        title: 'Lost & Found',
        application: shorelineAppMenu,
        order: 320,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_lost_found',
        active: true,
    },
})

// ---------- Admin modules ----------
Record({
    $id: Now.ID['mod_bundles'],
    table: 'sys_app_module',
    data: {
        title: 'Bundle Packages',
        application: shorelineAppMenu,
        order: 400,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_bundle',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_memberships'],
    table: 'sys_app_module',
    data: {
        title: 'Members',
        application: shorelineAppMenu,
        order: 410,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_membership',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_vip_members'],
    table: 'sys_app_module',
    data: {
        title: 'VIP Members',
        application: shorelineAppMenu,
        order: 420,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_membership',
        filter: 'tier=wave_rider^active=true',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_lessons'],
    table: 'sys_app_module',
    data: {
        title: 'Lesson Offerings',
        application: shorelineAppMenu,
        order: 430,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_lesson',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_locations'],
    table: 'sys_app_module',
    data: {
        title: 'Beach Stand Locations',
        application: shorelineAppMenu,
        order: 440,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_location',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})
Record({
    $id: Now.ID['mod_categories'],
    table: 'sys_app_module',
    data: {
        title: 'Categories',
        application: shorelineAppMenu,
        order: 450,
        link_type: 'LIST',
        name: 'x_1939459_shorelin_category',
        roles: ['x_1939459_shorelin.admin'],
        active: true,
    },
})

Record({
    $id: Now.ID['mod_separator'],
    table: 'sys_app_module',
    data: {
        title: '-- End-user experience --',
        application: shorelineAppMenu,
        order: 500,
        link_type: 'SEPARATOR',
        active: true,
    },
})
