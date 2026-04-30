import { ScriptInclude } from '@servicenow/sdk/core'

/**
 * Registers the RentalCalculator script include. Source lives in the server
 * module; ServiceNow will expose it as `x_1939459_shorelin.RentalCalculator`, callable
 * from client scripts via GlideAjax and from other server code.
 */
ScriptInclude({
    $id: Now.ID['si_rental_calculator'],
    name: 'RentalCalculator',
    active: true,
    apiName: 'x_1939459_shorelin.RentalCalculator',
    description:
        'Availability check + live pricing quotes for the Shoreline catalog.',
    script: Now.include('../../server/RentalCalculator.server.js'),
})
