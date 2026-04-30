import { ApplicationMenu, Record } from '@servicenow/sdk/core'

/**
 * Application category for Beach Bum
 */
export const beachBumCategory = Record({
    $id: Now.ID['beach_bum_category'],
    table: 'sys_app_category',
    data: {
        name: 'Beach Bum',
        style: 'border: 1px solid #4fc3f7; background-color: #e1f5fe;',
        default_order: 100,
    },
})

/**
 * Main application menu - appears in the navigation sidebar
 */
export const beachBumMenu = ApplicationMenu({
    $id: Now.ID['beach_bum_menu'],
    title: 'Beach Bum',
    hint: 'Beach equipment checkout management',
    description: 'Manage beach equipment inventory and customer checkouts',
    category: beachBumCategory,
    active: true,
})

/**
 * Navigation modules under the Beach Bum menu
 */
Record({
    $id: Now.ID['module_equipment_list'],
    table: 'sys_app_module',
    data: {
        title: 'All Equipment',
        application_menu: beachBumMenu,
        order: 100,
        link_type: 'LIST',
        name: 'x_beachbum_equipment',
        filter: '',
        active: true,
    },
})

Record({
    $id: Now.ID['module_new_equipment'],
    table: 'sys_app_module',
    data: {
        title: 'Add Equipment',
        application_menu: beachBumMenu,
        order: 200,
        link_type: 'NEW',
        name: 'x_beachbum_equipment',
        active: true,
    },
})

Record({
    $id: Now.ID['module_checkout_list'],
    table: 'sys_app_module',
    data: {
        title: 'All Checkouts',
        application_menu: beachBumMenu,
        order: 300,
        link_type: 'LIST',
        name: 'x_beachbum_checkout',
        filter: '',
        active: true,
    },
})

Record({
    $id: Now.ID['module_active_checkouts'],
    table: 'sys_app_module',
    data: {
        title: 'Active Checkouts',
        application_menu: beachBumMenu,
        order: 400,
        link_type: 'LIST',
        name: 'x_beachbum_checkout',
        filter: 'status=checked_out',
        active: true,
    },
})

Record({
    $id: Now.ID['module_overdue_checkouts'],
    table: 'sys_app_module',
    data: {
        title: 'Overdue Returns',
        application_menu: beachBumMenu,
        order: 500,
        link_type: 'LIST',
        name: 'x_beachbum_checkout',
        filter: 'status=overdue',
        active: true,
    },
})

Record({
    $id: Now.ID['module_new_checkout'],
    table: 'sys_app_module',
    data: {
        title: 'New Checkout',
        application_menu: beachBumMenu,
        order: 600,
        link_type: 'NEW',
        name: 'x_beachbum_checkout',
        active: true,
    },
})
