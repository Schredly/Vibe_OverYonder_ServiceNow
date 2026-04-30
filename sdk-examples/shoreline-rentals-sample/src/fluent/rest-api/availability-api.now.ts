import { RestApi } from '@servicenow/sdk/core'
import { listAvailability } from '../../server/availability-handler'

/**
 * Scripted REST API — exposes live inventory to external systems.
 *   GET  /api/x_1939459_shorelin/shoreline_availability
 */
RestApi({
    $id: Now.ID['api_availability'],
    name: 'Shoreline Availability API',
    service_id: 'shoreline_availability',
    consumes: 'application/json',
    routes: [
        {
            $id: Now.ID['api_availability_get'],
            name: 'list',
            method: 'GET',
            script: listAvailability,
        },
    ],
})
