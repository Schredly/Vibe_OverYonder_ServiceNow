import { RestApi } from '@servicenow/sdk/core'
import { getEggAvailability } from '../../server/egg-availability-handler'

/**
 * Scripted REST API — GET /api/x_1939459_cluck/egg_availability
 * Returns today's egg stock by grade + flock. Meant for chicken-fridge dashboards
 * or farmer's-market stand displays.
 */
RestApi({
    $id: Now.ID['api_egg_availability'],
    name: 'Cluck Egg Availability API',
    service_id: 'egg_availability',
    consumes: 'application/json',
    routes: [
        {
            $id: Now.ID['api_egg_availability_get'],
            name: 'today',
            method: 'GET',
            script: getEggAvailability,
        },
    ],
})
