import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['coop_big_red'],
    table: 'x_1939459_cluck_coop',
    data: {
        name: 'Big Red Barn',
        capacity: 60,
        square_meters: 45,
        style: 'fixed',
        heating: true,
        automatic_door: true,
        nest_boxes: 14,
        roost_length_m: 8,
        ventilation_rating: 'excellent',
        location_notes: 'Main layer house, east paddock',
        active: true,
    },
})

Record({
    $id: Now.ID['coop_tractor_1'],
    table: 'x_1939459_cluck_coop',
    data: {
        name: 'Chicken Tractor #1',
        capacity: 18,
        square_meters: 8,
        style: 'mobile',
        heating: false,
        automatic_door: false,
        nest_boxes: 4,
        roost_length_m: 2,
        ventilation_rating: 'good',
        location_notes: 'Rotates across pasture A/B/C on 3-day schedule',
        active: true,
    },
})

Record({
    $id: Now.ID['coop_tractor_2'],
    table: 'x_1939459_cluck_coop',
    data: {
        name: 'Chicken Tractor #2',
        capacity: 18,
        square_meters: 8,
        style: 'mobile',
        automatic_door: false,
        nest_boxes: 4,
        roost_length_m: 2,
        ventilation_rating: 'good',
        location_notes: 'Rotates across pasture D/E/F',
        active: true,
    },
})

Record({
    $id: Now.ID['coop_hoop'],
    table: 'x_1939459_cluck_coop',
    data: {
        name: 'Hoop House',
        capacity: 40,
        square_meters: 30,
        style: 'hoop',
        heating: false,
        automatic_door: true,
        nest_boxes: 10,
        roost_length_m: 5,
        ventilation_rating: 'good',
        location_notes: 'West pasture, for meat broiler batches',
        active: true,
    },
})

Record({
    $id: Now.ID['coop_brooder'],
    table: 'x_1939459_cluck_coop',
    data: {
        name: 'Brooder Shed',
        capacity: 80,
        square_meters: 12,
        style: 'fixed',
        heating: true,
        automatic_door: false,
        nest_boxes: 0,
        roost_length_m: 0,
        ventilation_rating: 'adequate',
        location_notes: 'Chick-rearing only, heat lamps 24/7 for first 3 weeks',
        active: true,
    },
})
