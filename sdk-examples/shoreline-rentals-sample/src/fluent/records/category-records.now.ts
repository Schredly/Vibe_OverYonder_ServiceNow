import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['cat_shade_seating'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Shade & Seating',
        short_code: 'SHADE',
        description: 'Umbrellas, chairs, cabanas — keep the sun at bay.',
        icon: 'umbrella-beach',
        color_hex: '#f4a261',
        sort_order: 100,
    },
})

Record({
    $id: Now.ID['cat_water_sports'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Water Sports',
        short_code: 'WATER',
        description: 'Surfboards, boogie boards, SUPs, kayaks, wetsuits.',
        icon: 'surfboard',
        color_hex: '#2a9d8f',
        sort_order: 200,
    },
})

Record({
    $id: Now.ID['cat_essentials'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Beach Essentials',
        short_code: 'ESSENT',
        description: 'Towels, coolers, wagons, mats — the basics you forgot.',
        icon: 'campground',
        color_hex: '#264653',
        sort_order: 300,
    },
})

Record({
    $id: Now.ID['cat_games'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Games & Kids',
        short_code: 'GAMES',
        description: 'Volleyball, Spikeball, sand toys, kites, frisbees.',
        icon: 'toys',
        color_hex: '#e76f51',
        age_restriction: 'none',
        sort_order: 400,
    },
})

Record({
    $id: Now.ID['cat_tech'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Tech & Tunes',
        short_code: 'TECH',
        description: 'Bluetooth speakers, GoPros, metal detectors.',
        icon: 'speaker',
        color_hex: '#457b9d',
        sort_order: 500,
    },
})

Record({
    $id: Now.ID['cat_wheels'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Wheels',
        short_code: 'WHEELS',
        description: 'Beach cruiser bikes and heavy-duty wagons.',
        icon: 'bicycle',
        color_hex: '#6a4c93',
        age_restriction: 'supervised_minor',
        sort_order: 600,
    },
})

Record({
    $id: Now.ID['cat_evening'],
    table: 'x_1939459_shorelin_category',
    data: {
        name: 'Sunset & Evening',
        short_code: 'SUNSET',
        description: 'Bonfire kits, tiki torches, hammocks, outdoor movies.',
        icon: 'campground',
        color_hex: '#ff6b6b',
        age_restriction: 'adult_only',
        sort_order: 700,
    },
})
