import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { cluckFarmhand } from '../roles/roles.now'

/**
 * Cluckworks sidebar — the admin nav for farmhands/farmers/admins.
 */

export const cluckCategory = Record({
    $id: Now.ID['app_cat_cluck'],
    table: 'sys_app_category',
    data: {
        name: 'Cluckworks',
        style: 'border: 1px solid #c9892a; background-color: #fff8e7;',
        default_order: 100,
    },
})

export const cluckAppMenu = ApplicationMenu({
    $id: Now.ID['app_menu_cluck'],
    title: 'Cluckworks',
    hint: 'Flocks, eggs, feed, incubation, orders',
    description:
        'Administer the Cluckworks farm operation — flocks, birds, eggs, feed, incubation, orders, CSA, incidents.',
    category: cluckCategory,
    active: true,
    roles: [cluckFarmhand],
})

// ---------- Flocks & Birds ----------
Record({
    $id: Now.ID['mod_flocks'],
    table: 'sys_app_module',
    data: {
        title: 'All Flocks',
        application: cluckAppMenu,
        order: 100,
        link_type: 'LIST',
        name: 'x_1939459_cluck_flock',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_coops'],
    table: 'sys_app_module',
    data: {
        title: 'Coops',
        application: cluckAppMenu,
        order: 110,
        link_type: 'LIST',
        name: 'x_1939459_cluck_coop',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_birds'],
    table: 'sys_app_module',
    data: {
        title: 'All Birds',
        application: cluckAppMenu,
        order: 120,
        link_type: 'LIST',
        name: 'x_1939459_cluck_bird',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_adoptable'],
    table: 'sys_app_module',
    data: {
        title: 'Adoptable Hens',
        application: cluckAppMenu,
        order: 125,
        link_type: 'LIST',
        name: 'x_1939459_cluck_bird',
        filter: 'is_adoptable=true^status=active',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_breeders'],
    table: 'sys_app_module',
    data: {
        title: 'Breeding Stock',
        application: cluckAppMenu,
        order: 130,
        link_type: 'LIST',
        name: 'x_1939459_cluck_bird',
        filter: 'is_breeding_stock=true',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_breeds'],
    table: 'sys_app_module',
    data: {
        title: 'Breed Catalog',
        application: cluckAppMenu,
        order: 140,
        link_type: 'LIST',
        name: 'x_1939459_cluck_breed',
        active: true,
    },
})

// ---------- Eggs ----------
Record({
    $id: Now.ID['mod_egg_log_today'],
    table: 'sys_app_module',
    data: {
        title: "Today's Egg Log",
        application: cluckAppMenu,
        order: 200,
        link_type: 'LIST',
        name: 'x_1939459_cluck_egg_log',
        filter: 'log_dateONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_egg_log_all'],
    table: 'sys_app_module',
    data: {
        title: 'Egg Log (all)',
        application: cluckAppMenu,
        order: 210,
        link_type: 'LIST',
        name: 'x_1939459_cluck_egg_log',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_egg_log_new'],
    table: 'sys_app_module',
    data: {
        title: 'Log Today\'s Eggs',
        application: cluckAppMenu,
        order: 220,
        link_type: 'NEW',
        name: 'x_1939459_cluck_egg_log',
        active: true,
    },
})

// ---------- Feed ----------
Record({
    $id: Now.ID['mod_feed'],
    table: 'sys_app_module',
    data: {
        title: 'Feed Inventory',
        application: cluckAppMenu,
        order: 300,
        link_type: 'LIST',
        name: 'x_1939459_cluck_feed',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_feed_low'],
    table: 'sys_app_module',
    data: {
        title: 'Low Stock Feed',
        application: cluckAppMenu,
        order: 310,
        link_type: 'LIST',
        name: 'x_1939459_cluck_feed',
        filter: 'on_hand_bags<=reorder_threshold',
        active: true,
    },
})

// ---------- Health & Incubation ----------
Record({
    $id: Now.ID['mod_health'],
    table: 'sys_app_module',
    data: {
        title: 'Health Records',
        application: cluckAppMenu,
        order: 400,
        link_type: 'LIST',
        name: 'x_1939459_cluck_health_record',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_health_open'],
    table: 'sys_app_module',
    data: {
        title: 'Open Health Cases',
        application: cluckAppMenu,
        order: 410,
        link_type: 'LIST',
        name: 'x_1939459_cluck_health_record',
        filter: 'outcome=ongoing',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_incubation'],
    table: 'sys_app_module',
    data: {
        title: 'Incubation Batches',
        application: cluckAppMenu,
        order: 420,
        link_type: 'LIST',
        name: 'x_1939459_cluck_incubation',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_incubation_active'],
    table: 'sys_app_module',
    data: {
        title: 'Active Incubations',
        application: cluckAppMenu,
        order: 430,
        link_type: 'LIST',
        name: 'x_1939459_cluck_incubation',
        filter: 'statusINincubating,lockdown,hatching',
        active: true,
    },
})

// ---------- Customer-facing ----------
Record({
    $id: Now.ID['mod_orders'],
    table: 'sys_app_module',
    data: {
        title: 'All Orders',
        application: cluckAppMenu,
        order: 500,
        link_type: 'LIST',
        name: 'x_1939459_cluck_order',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_orders_pending'],
    table: 'sys_app_module',
    data: {
        title: 'Orders to Fulfill',
        application: cluckAppMenu,
        order: 510,
        link_type: 'LIST',
        name: 'x_1939459_cluck_order',
        filter: 'fulfillment_statusINpending,ready,out_for_delivery',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_csa_active'],
    table: 'sys_app_module',
    data: {
        title: 'Active CSA Subscriptions',
        application: cluckAppMenu,
        order: 520,
        link_type: 'LIST',
        name: 'x_1939459_cluck_subscription',
        filter: 'status=active',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_customers'],
    table: 'sys_app_module',
    data: {
        title: 'Customers',
        application: cluckAppMenu,
        order: 530,
        link_type: 'LIST',
        name: 'x_1939459_cluck_customer',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_sponsors'],
    table: 'sys_app_module',
    data: {
        title: 'Hen Sponsors',
        application: cluckAppMenu,
        order: 540,
        link_type: 'LIST',
        name: 'x_1939459_cluck_customer',
        filter: 'tier=sponsor',
        active: true,
    },
})

// ---------- Incidents ----------
Record({
    $id: Now.ID['mod_incidents'],
    table: 'sys_app_module',
    data: {
        title: 'All Incidents',
        application: cluckAppMenu,
        order: 600,
        link_type: 'LIST',
        name: 'x_1939459_cluck_incident',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_incidents_open'],
    table: 'sys_app_module',
    data: {
        title: 'Open Incidents',
        application: cluckAppMenu,
        order: 610,
        link_type: 'LIST',
        name: 'x_1939459_cluck_incident',
        filter: 'active=true',
        active: true,
    },
})
Record({
    $id: Now.ID['mod_incidents_critical'],
    table: 'sys_app_module',
    data: {
        title: 'Critical Incidents',
        application: cluckAppMenu,
        order: 620,
        link_type: 'LIST',
        name: 'x_1939459_cluck_incident',
        filter: 'severity=critical^active=true',
        active: true,
    },
})

Record({
    $id: Now.ID['mod_separator_1'],
    table: 'sys_app_module',
    data: {
        title: '-- Customer experience --',
        application: cluckAppMenu,
        order: 700,
        link_type: 'SEPARATOR',
        active: true,
    },
})
