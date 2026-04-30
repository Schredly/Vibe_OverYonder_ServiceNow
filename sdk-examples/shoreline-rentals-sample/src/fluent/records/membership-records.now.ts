import { Record } from '@servicenow/sdk/core'

/**
 * Seed the three tier "templates" so reports can count active members per tier
 * before any real guests have signed up.
 */

Record({
    $id: Now.ID['member_demo_beachcomber'],
    table: 'x_1939459_shorelin_membership',
    data: {
        member_number: 'SH-0001',
        full_name: 'Demo Beachcomber',
        email: 'demo+beachcomber@shoreline.example',
        tier: 'beachcomber',
        discount_percent: 0,
        loyalty_points: 0,
        lifetime_spend: 0,
        joined_on: '2026-01-15',
        waiver_on_file: false,
        active: true,
    },
})

Record({
    $id: Now.ID['member_demo_sunchaser'],
    table: 'x_1939459_shorelin_membership',
    data: {
        member_number: 'SH-0002',
        full_name: 'Demo Sun Chaser',
        email: 'demo+sunchaser@shoreline.example',
        tier: 'sun_chaser',
        discount_percent: 10,
        loyalty_points: 250,
        lifetime_spend: 480,
        joined_on: '2025-06-01',
        expires_on: '2026-06-01',
        waiver_on_file: true,
        active: true,
    },
})

Record({
    $id: Now.ID['member_demo_vip'],
    table: 'x_1939459_shorelin_membership',
    data: {
        member_number: 'SH-0003',
        full_name: 'Demo Wave Rider VIP',
        email: 'demo+vip@shoreline.example',
        tier: 'wave_rider',
        discount_percent: 20,
        loyalty_points: 1420,
        lifetime_spend: 3250,
        joined_on: '2024-05-12',
        expires_on: '2026-05-12',
        waiver_on_file: true,
        active: true,
    },
})
