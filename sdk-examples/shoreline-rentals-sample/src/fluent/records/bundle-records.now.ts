import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['bundle_family_fun'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Family Fun Pack',
        tagline: 'Everything a family of four needs for a day at the beach.',
        description:
            '1 umbrella, 4 chairs, 2 towels, 1 wagon, 1 cooler, 1 sand-toy bucket.',
        theme: 'family',
        includes_summary:
            '1× Umbrella, 4× Chairs, 2× Towels, 1× Wagon, 1× Cooler, 1× Sand Toy Bucket',
        list_price: 89,
        bundle_price: 65,
        savings: 24,
        max_duration_hours: 8,
        featured: true,
    },
})

Record({
    $id: Now.ID['bundle_surf_session'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Surf Session',
        tagline: 'Catch your first wave — board, suit, and gear included.',
        description:
            '1 foam surfboard, 1 wetsuit, 1 towel. Great for beginners.',
        theme: 'surf',
        includes_summary: '1× Foam Surfboard, 1× Wetsuit, 1× Towel',
        list_price: 70,
        bundle_price: 55,
        savings: 15,
        max_duration_hours: 4,
        featured: true,
    },
})

Record({
    $id: Now.ID['bundle_sunset_chill'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Sunset Chill',
        tagline: 'Wind down after dark with tunes, a fire, and a hammock.',
        description:
            '1 hammock, 1 bonfire kit, 1 speaker, 1 cooler. Evening-only; weather dependent.',
        theme: 'sunset',
        includes_summary:
            '1× Double Hammock, 1× Bonfire Kit, 1× Bluetooth Speaker, 1× Cooler',
        list_price: 110,
        bundle_price: 85,
        savings: 25,
        max_duration_hours: 5,
        featured: true,
    },
})

Record({
    $id: Now.ID['bundle_kids_adventure'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Kids Adventure',
        tagline: 'A full day of play for the little ones.',
        description:
            '1 baby sun tent, 1 sand-toy bucket, 1 boogie board, 1 kite, 2 towels.',
        theme: 'kids',
        includes_summary:
            '1× Baby Tent, 1× Sand Toys, 1× Boogie Board, 1× Kite, 2× Towels',
        list_price: 55,
        bundle_price: 42,
        savings: 13,
        max_duration_hours: 8,
        featured: true,
    },
})

Record({
    $id: Now.ID['bundle_romantic'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Romantic Getaway',
        tagline: 'Two chairs, a cooler, and a sunset. You bring the date.',
        description:
            '2 chairs, 1 umbrella, 1 cooler, 1 speaker, 2 towels. Adults only.',
        theme: 'romantic',
        includes_summary:
            '2× Chairs, 1× Umbrella, 1× Cooler, 1× Speaker, 2× Towels',
        list_price: 60,
        bundle_price: 45,
        savings: 15,
        max_duration_hours: 6,
        featured: false,
    },
})

Record({
    $id: Now.ID['bundle_adventure'],
    table: 'x_1939459_shorelin_bundle',
    data: {
        name: 'Treasure Hunter',
        tagline: 'Metal detector, a kite to signal, and a wagon to haul it.',
        description:
            '1 metal detector, 1 kite, 1 wagon, 1 towel. For the explorer.',
        theme: 'adventure',
        includes_summary:
            '1× Metal Detector, 1× Kite, 1× Wagon, 1× Towel',
        list_price: 65,
        bundle_price: 50,
        savings: 15,
        max_duration_hours: 6,
        featured: false,
    },
})
