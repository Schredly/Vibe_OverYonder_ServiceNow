import { Record } from '@servicenow/sdk/core'

/**
 * Seed data - starter inventory for Beach Bum
 */

Record({
    $id: Now.ID['equip_chairs'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Standard Beach Chair',
        type: 'chair',
        total_quantity: 20,
        available_quantity: 20,
        condition: 'good',
        daily_rate: '10',
        description: 'Foldable beach chair with cup holder',
    },
})

Record({
    $id: Now.ID['equip_umbrellas'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Large Beach Umbrella',
        type: 'umbrella',
        total_quantity: 15,
        available_quantity: 15,
        condition: 'good',
        daily_rate: '15',
        description: '7-foot beach umbrella with UV protection',
    },
})

Record({
    $id: Now.ID['equip_boogie_boards'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Boogie Board',
        type: 'boogie_board',
        total_quantity: 10,
        available_quantity: 10,
        condition: 'good',
        daily_rate: '12',
        description: '42-inch bodyboard for all skill levels',
    },
})

Record({
    $id: Now.ID['equip_surfboards'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Foam Surfboard',
        type: 'surfboard',
        total_quantity: 8,
        available_quantity: 8,
        condition: 'good',
        daily_rate: '25',
        description: '8-foot foam surfboard, great for beginners',
    },
})

Record({
    $id: Now.ID['equip_towels'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Beach Towel',
        type: 'towel',
        total_quantity: 50,
        available_quantity: 50,
        condition: 'new',
        daily_rate: '5',
        description: 'Oversized beach towel',
    },
})

Record({
    $id: Now.ID['equip_coolers'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Portable Cooler',
        type: 'cooler',
        total_quantity: 10,
        available_quantity: 10,
        condition: 'good',
        daily_rate: '8',
        description: '24-can soft cooler with shoulder strap',
    },
})

Record({
    $id: Now.ID['equip_snorkel_sets'],
    table: 'x_beachbum_equipment',
    data: {
        name: 'Snorkel Set',
        type: 'snorkel_set',
        total_quantity: 12,
        available_quantity: 12,
        condition: 'good',
        daily_rate: '15',
        description: 'Mask, snorkel, and fins set',
    },
})
