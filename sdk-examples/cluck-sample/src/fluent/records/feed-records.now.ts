import { Record } from '@servicenow/sdk/core'

/**
 * Feed inventory starter set — a realistic small-farm pantry.
 */

Record({
    $id: Now.ID['feed_layer_organic'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Organic Layer Pellet',
        sku: 'FD-LAY-ORG',
        feed_type: 'layer',
        supplier: 'Nature\'s Best Organic',
        bag_size_kg: 22.7,
        cost_per_bag: 38,
        protein_pct: 17,
        organic: true,
        non_gmo: true,
        on_hand_bags: 8,
        reorder_threshold: 3,
        reorder_quantity: 20,
        storage_location: 'Barn loft — east bin',
    },
})

Record({
    $id: Now.ID['feed_starter'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Chick Starter Crumble (Non-Medicated)',
        sku: 'FD-STR-NM',
        feed_type: 'starter',
        supplier: 'Scratch & Peck',
        bag_size_kg: 18,
        cost_per_bag: 42,
        protein_pct: 22,
        non_gmo: true,
        on_hand_bags: 4,
        reorder_threshold: 2,
        reorder_quantity: 8,
        storage_location: 'Brooder shed',
    },
})

Record({
    $id: Now.ID['feed_grower'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Grower Crumble',
        sku: 'FD-GRW',
        feed_type: 'grower',
        supplier: 'Local Co-op',
        bag_size_kg: 22.7,
        cost_per_bag: 22,
        protein_pct: 18,
        non_gmo: false,
        on_hand_bags: 6,
        reorder_threshold: 2,
        reorder_quantity: 10,
        storage_location: 'Barn loft — center bin',
    },
})

Record({
    $id: Now.ID['feed_scratch'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Scratch Grain Mix',
        sku: 'FD-SCR',
        feed_type: 'scratch',
        supplier: 'Local Co-op',
        bag_size_kg: 22.7,
        cost_per_bag: 18,
        protein_pct: 10,
        non_gmo: false,
        on_hand_bags: 5,
        reorder_threshold: 2,
        reorder_quantity: 10,
        storage_location: 'Barn loft — west bin',
    },
})

Record({
    $id: Now.ID['feed_mealworms'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Dried Mealworms (treat)',
        sku: 'FD-MLW',
        feed_type: 'treat',
        supplier: 'Grubblies',
        bag_size_kg: 4.5,
        cost_per_bag: 35,
        protein_pct: 53,
        non_gmo: true,
        on_hand_bags: 3,
        reorder_threshold: 1,
        reorder_quantity: 4,
        storage_location: 'Egg-washing room',
    },
})

Record({
    $id: Now.ID['feed_oyster_shell'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Oyster Shell (calcium)',
        sku: 'FD-OYS',
        feed_type: 'supplement',
        supplier: 'Local Co-op',
        bag_size_kg: 22.7,
        cost_per_bag: 16,
        protein_pct: 0,
        on_hand_bags: 4,
        reorder_threshold: 1,
        reorder_quantity: 4,
        storage_location: 'Free-choice feeder — Big Red Barn',
    },
})

Record({
    $id: Now.ID['feed_grit'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Poultry Grit',
        sku: 'FD-GRT',
        feed_type: 'supplement',
        supplier: 'Local Co-op',
        bag_size_kg: 22.7,
        cost_per_bag: 14,
        protein_pct: 0,
        on_hand_bags: 2,
        reorder_threshold: 1,
        reorder_quantity: 4,
        storage_location: 'Free-choice feeder — all coops',
    },
})

Record({
    $id: Now.ID['feed_broiler'],
    table: 'x_1939459_cluck_feed',
    data: {
        name: 'Broiler Finisher',
        sku: 'FD-BRL',
        feed_type: 'broiler',
        supplier: 'Local Co-op',
        bag_size_kg: 22.7,
        cost_per_bag: 24,
        protein_pct: 20,
        on_hand_bags: 0,
        reorder_threshold: 2,
        reorder_quantity: 15,
        storage_location: 'Hoop house annex',
    },
})
