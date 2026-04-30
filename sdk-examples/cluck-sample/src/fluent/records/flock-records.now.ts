import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['flock_main_layers'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Main Layer Flock',
        coop: Now.ID['coop_big_red'],
        purpose: 'laying',
        current_count: 48,
        pasture_rotation_days: 0,
        feed_schedule: 'twice_daily',
        status: 'active',
        featured: true,
        notes: 'Core production flock; mix of RIRs, Australorps, Ameraucanas, Marans.',
    },
})

Record({
    $id: Now.ID['flock_pasture_a'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Pasture Squad A',
        coop: Now.ID['coop_tractor_1'],
        purpose: 'laying',
        current_count: 16,
        pasture_rotation_days: 3,
        feed_schedule: 'pasture_only',
        status: 'active',
        featured: true,
        notes: 'Mobile-coop layers rotating across pastures A/B/C.',
    },
})

Record({
    $id: Now.ID['flock_pasture_b'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Pasture Squad B',
        coop: Now.ID['coop_tractor_2'],
        purpose: 'laying',
        current_count: 15,
        pasture_rotation_days: 3,
        feed_schedule: 'pasture_only',
        status: 'active',
        notes: 'Sister flock of Squad A, rotating D/E/F.',
    },
})

Record({
    $id: Now.ID['flock_breeders'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Heritage Breeders',
        coop: Now.ID['coop_big_red'],
        purpose: 'breeding',
        current_count: 8,
        feed_schedule: 'twice_daily',
        status: 'active',
        notes: 'Selected hens + 1 rooster; fertile eggs for our incubation program.',
    },
})

Record({
    $id: Now.ID['flock_broilers'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Broiler Batch #7',
        coop: Now.ID['coop_hoop'],
        purpose: 'meat',
        current_count: 28,
        feed_schedule: 'free_feed',
        status: 'active',
        notes: 'Cornish Cross, 6 weeks old, processing in 2 weeks.',
    },
})

Record({
    $id: Now.ID['flock_brooder'],
    table: 'x_1939459_cluck_flock',
    data: {
        name: 'Spring Chicks',
        coop: Now.ID['coop_brooder'],
        purpose: 'brooder',
        current_count: 40,
        feed_schedule: 'free_feed',
        status: 'active',
        notes: 'Mixed breed chicks from March incubation batch.',
    },
})
