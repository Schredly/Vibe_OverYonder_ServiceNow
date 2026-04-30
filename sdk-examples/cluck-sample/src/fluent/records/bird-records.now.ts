import { Record } from '@servicenow/sdk/core'

/**
 * Our celebrity hens — the ones customers can adopt via the "Adopt-a-Hen"
 * catalog item. Each one gets a name, a bio, and a personality score.
 */

Record({
    $id: Now.ID['bird_henrietta'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-001',
        name: 'Henrietta',
        breed: Now.ID['breed_rir'],
        flock: Now.ID['flock_main_layers'],
        sex: 'hen',
        weight_grams: 2900,
        color_pattern: 'Classic mahogany',
        is_breeding_stock: true,
        is_adoptable: true,
        egg_color_observed: 'Rich brown',
        lifetime_eggs: 847,
        status: 'active',
        personality_score: 9,
        bio: 'The farm matriarch. Knows her name, follows the farmhands around, and has never missed a day laying. Three-time "Hen of the Month" award.',
    },
})

Record({
    $id: Now.ID['bird_cluckzilla'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-002',
        name: 'Cluckzilla',
        breed: Now.ID['breed_orpington'],
        flock: Now.ID['flock_main_layers'],
        sex: 'hen',
        weight_grams: 3800,
        color_pattern: 'Buff gold',
        is_adoptable: true,
        egg_color_observed: 'Light brown',
        lifetime_eggs: 412,
        status: 'active',
        personality_score: 10,
        bio: 'An absolute unit. Soft as a cloud, loud as a freight train when she lays. Will sit in your lap all afternoon.',
    },
})

Record({
    $id: Now.ID['bird_bluebell'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-003',
        name: 'Bluebell',
        breed: Now.ID['breed_ameraucana'],
        flock: Now.ID['flock_main_layers'],
        sex: 'hen',
        weight_grams: 2400,
        color_pattern: 'Blue-gray with muffs',
        is_adoptable: true,
        egg_color_observed: 'Robin-egg blue',
        lifetime_eggs: 298,
        status: 'active',
        personality_score: 7,
        bio: 'Shy but curious. Lays a perfect sky-blue egg every 24 hours like clockwork.',
    },
})

Record({
    $id: Now.ID['bird_midnight'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-004',
        name: 'Midnight',
        breed: Now.ID['breed_marans'],
        flock: Now.ID['flock_breeders'],
        sex: 'hen',
        weight_grams: 3100,
        color_pattern: 'Black copper',
        is_breeding_stock: true,
        is_adoptable: true,
        egg_color_observed: 'Deep chocolate',
        lifetime_eggs: 362,
        status: 'active',
        personality_score: 6,
        bio: 'Prized for chocolate-brown eggs so dark they look painted. Chef at Ember Kitchen calls weekly asking for her eggs.',
    },
})

Record({
    $id: Now.ID['bird_nugget'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-005',
        name: 'Nugget',
        breed: Now.ID['breed_silkie'],
        flock: Now.ID['flock_main_layers'],
        sex: 'hen',
        weight_grams: 900,
        color_pattern: 'White puffball',
        is_adoptable: true,
        egg_color_observed: 'Cream',
        lifetime_eggs: 94,
        status: 'brooding',
        personality_score: 10,
        bio: 'The designated auntie. Will sit on any egg you give her. Currently brooding rare-breed eggs from Etsy.',
    },
})

Record({
    $id: Now.ID['bird_olive'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-006',
        name: 'Olive',
        breed: Now.ID['breed_olive_egger'],
        flock: Now.ID['flock_pasture_a'],
        sex: 'hen',
        weight_grams: 2700,
        color_pattern: 'Speckled brown',
        is_adoptable: true,
        egg_color_observed: 'Mossy green',
        lifetime_eggs: 188,
        status: 'active',
        personality_score: 8,
        bio: 'Lives for dust baths. Has a rivalry with Bluebell over the best dusting spot by the barn.',
    },
})

Record({
    $id: Now.ID['bird_general_tso'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'R-001',
        name: 'General Tso',
        breed: Now.ID['breed_wyandotte'],
        flock: Now.ID['flock_breeders'],
        sex: 'rooster',
        weight_grams: 3600,
        color_pattern: 'Silver-laced',
        is_breeding_stock: true,
        is_adoptable: false,
        status: 'active',
        personality_score: 4,
        bio: 'Head of security. Crows at 4:37 AM exactly. Fearless toward hawks. Do not turn your back on him.',
    },
})

Record({
    $id: Now.ID['bird_snowball'],
    table: 'x_1939459_cluck_bird',
    data: {
        tag_id: 'H-007',
        name: 'Snowball',
        breed: Now.ID['breed_leghorn'],
        flock: Now.ID['flock_pasture_b'],
        sex: 'hen',
        weight_grams: 2000,
        color_pattern: 'All white',
        is_adoptable: true,
        egg_color_observed: 'Pure white',
        lifetime_eggs: 724,
        status: 'active',
        personality_score: 5,
        bio: 'A production machine. Flies over the fence to inspect the garden. Has beaten her sister Flurry in eggs-per-week for 18 straight months.',
    },
})
