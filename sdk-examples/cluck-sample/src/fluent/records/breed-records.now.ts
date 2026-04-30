import { Record } from '@servicenow/sdk/core'

/**
 * Seed breeds — a realistic mix of layer, dual-purpose, and heritage breeds.
 * All production numbers are industry averages.
 */

Record({
    $id: Now.ID['breed_leghorn'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'White Leghorn',
        purpose: 'layer',
        avg_eggs_per_year: 300,
        egg_color: 'white',
        temperament: 'active',
        avg_weight_kg: 2000,
        cold_hardy: false,
        heat_tolerant: true,
        heritage: false,
        description:
            'The classic white-egg layer. Prolific, feed-efficient, but flighty and not cuddly.',
    },
})

Record({
    $id: Now.ID['breed_rir'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Rhode Island Red',
        purpose: 'dual',
        avg_eggs_per_year: 260,
        egg_color: 'brown',
        temperament: 'docile',
        avg_weight_kg: 2900,
        cold_hardy: true,
        heat_tolerant: true,
        heritage: true,
        description:
            'Workhorse dual-purpose breed. Great brown eggs, hardy, tolerant of beginners.',
    },
})

Record({
    $id: Now.ID['breed_orpington'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Buff Orpington',
        purpose: 'dual',
        avg_eggs_per_year: 200,
        egg_color: 'brown',
        temperament: 'docile',
        avg_weight_kg: 3600,
        cold_hardy: true,
        heat_tolerant: false,
        heritage: true,
        description:
            'Big, fluffy, and sweet — the golden retriever of chickens. Excellent for families.',
    },
})

Record({
    $id: Now.ID['breed_ameraucana'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Ameraucana',
        purpose: 'layer',
        avg_eggs_per_year: 230,
        egg_color: 'blue',
        temperament: 'docile',
        avg_weight_kg: 2500,
        cold_hardy: true,
        heat_tolerant: true,
        heritage: false,
        description:
            'Blue-egg layer with muffs and a beard. A rainbow-basket staple.',
    },
})

Record({
    $id: Now.ID['breed_marans'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Black Copper Marans',
        purpose: 'layer',
        avg_eggs_per_year: 200,
        egg_color: 'chocolate',
        temperament: 'docile',
        avg_weight_kg: 3000,
        cold_hardy: true,
        heritage: true,
        description:
            'The dark-chocolate egg layer. French heritage breed, chef favorite.',
    },
})

Record({
    $id: Now.ID['breed_wyandotte'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Silver-Laced Wyandotte',
        purpose: 'dual',
        avg_eggs_per_year: 220,
        egg_color: 'brown',
        temperament: 'docile',
        avg_weight_kg: 2950,
        cold_hardy: true,
        heritage: true,
        description:
            'Beautiful scalloped feathering, rose comb (no frostbite), very cold-hardy.',
    },
})

Record({
    $id: Now.ID['breed_australorp'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Australorp',
        purpose: 'dual',
        avg_eggs_per_year: 280,
        egg_color: 'brown',
        temperament: 'docile',
        avg_weight_kg: 2950,
        cold_hardy: true,
        heat_tolerant: true,
        heritage: true,
        description:
            'Holds the world record for eggs-in-a-year (364). Glossy black beetle-green plumage.',
    },
})

Record({
    $id: Now.ID['breed_silkie'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Silkie Bantam',
        purpose: 'ornamental',
        avg_eggs_per_year: 100,
        egg_color: 'cream',
        temperament: 'broody',
        avg_weight_kg: 900,
        cold_hardy: false,
        heritage: true,
        description:
            'Fluffy, docile, extraordinary brooders — we use them to hatch rare-breed eggs.',
    },
})

Record({
    $id: Now.ID['breed_olive_egger'],
    table: 'x_1939459_cluck_breed',
    data: {
        name: 'Olive Egger',
        purpose: 'layer',
        avg_eggs_per_year: 200,
        egg_color: 'green',
        temperament: 'docile',
        avg_weight_kg: 2700,
        cold_hardy: true,
        description:
            'Marans × Ameraucana cross — gorgeous olive-green eggs.',
    },
})
