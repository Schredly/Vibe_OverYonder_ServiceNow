import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['loc_main_pier'],
    table: 'x_1939459_shorelin_location',
    data: {
        name: 'Main Pier Stand',
        address: '100 Ocean Blvd',
        city: 'Santa Monica',
        state: 'CA',
        latitude: 34.0086,
        longitude: -118.4977,
        phone: '310-555-0100',
        hours: '6:30 AM – 8:00 PM',
        allows_walkup: true,
        active: true,
    },
})

Record({
    $id: Now.ID['loc_north_cove'],
    table: 'x_1939459_shorelin_location',
    data: {
        name: 'North Cove Kiosk',
        address: '800 Ocean Blvd',
        city: 'Santa Monica',
        state: 'CA',
        latitude: 34.0255,
        longitude: -118.5070,
        phone: '310-555-0110',
        hours: '7:00 AM – 7:00 PM',
        allows_walkup: true,
        active: true,
    },
})

Record({
    $id: Now.ID['loc_south_jetty'],
    table: 'x_1939459_shorelin_location',
    data: {
        name: 'South Jetty Shack',
        address: '50 Jetty Way',
        city: 'Venice',
        state: 'CA',
        latitude: 33.9850,
        longitude: -118.4695,
        phone: '310-555-0120',
        hours: '7:00 AM – 6:30 PM',
        allows_walkup: true,
        active: true,
    },
})

Record({
    $id: Now.ID['loc_hotel_partner'],
    table: 'x_1939459_shorelin_location',
    data: {
        name: 'Seabreeze Hotel Partner Desk',
        address: '201 Pacific Ave',
        city: 'Santa Monica',
        state: 'CA',
        latitude: 34.0140,
        longitude: -118.4960,
        phone: '310-555-0188',
        hours: '8:00 AM – 6:00 PM',
        allows_walkup: false,
        active: true,
    },
})
