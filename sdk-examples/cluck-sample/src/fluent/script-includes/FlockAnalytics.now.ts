import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si_flock_analytics'],
    name: 'FlockAnalytics',
    active: true,
    apiName: 'x_1939459_cluck.FlockAnalytics',
    description:
        'Client-callable analytics — production rate, FCR, mortality, today\'s egg availability, adoptable hen list.',
    script: Now.include('../../server/FlockAnalytics.server.js'),
})
