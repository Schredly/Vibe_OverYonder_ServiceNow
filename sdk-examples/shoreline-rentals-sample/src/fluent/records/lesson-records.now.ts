import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['lesson_surf_beginner'],
    table: 'x_1939459_shorelin_lesson',
    data: {
        name: 'Surf 101 — Beginner Group Lesson',
        type: 'surf',
        skill_level: 'beginner',
        description:
            '90-minute group surf lesson for first-timers. Includes board, wetsuit, and rash guard.',
        duration_minutes: 90,
        group_size_max: 6,
        price_per_person: 60,
        price_private: 180,
        includes_gear: true,
        active: true,
    },
})

Record({
    $id: Now.ID['lesson_sup_yoga'],
    table: 'x_1939459_shorelin_lesson',
    data: {
        name: 'SUP Yoga',
        type: 'sup_yoga',
        skill_level: 'all_levels',
        description:
            'Sunrise SUP yoga session in the calm cove. All levels welcome.',
        duration_minutes: 60,
        group_size_max: 8,
        price_per_person: 45,
        price_private: 150,
        includes_gear: true,
        active: true,
    },
})

Record({
    $id: Now.ID['lesson_snorkel_tour'],
    table: 'x_1939459_shorelin_lesson',
    data: {
        name: 'Guided Snorkel Tour',
        type: 'snorkel',
        skill_level: 'beginner',
        description:
            '75-minute guided snorkel along the reef. Group of up to 6.',
        duration_minutes: 75,
        group_size_max: 6,
        price_per_person: 50,
        includes_gear: true,
        active: true,
    },
})

Record({
    $id: Now.ID['lesson_sandcastle'],
    table: 'x_1939459_shorelin_lesson',
    data: {
        name: 'Sandcastle Architecture Workshop',
        type: 'sandcastle',
        skill_level: 'all_levels',
        description:
            '2-hour workshop with a pro sand sculptor. Bring the kids. No seriously, bring the kids.',
        duration_minutes: 120,
        group_size_max: 10,
        price_per_person: 35,
        includes_gear: true,
        active: true,
    },
})

Record({
    $id: Now.ID['lesson_kayak_tour'],
    table: 'x_1939459_shorelin_lesson',
    data: {
        name: 'Sunset Kayak Tour',
        type: 'kayak_tour',
        skill_level: 'intermediate',
        description:
            'Two-hour guided kayak tour along the coastline at golden hour.',
        duration_minutes: 120,
        group_size_max: 8,
        price_per_person: 65,
        includes_gear: true,
        active: true,
    },
})
