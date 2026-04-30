import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['si_pricing_engine'],
    name: 'PricingEngine',
    active: true,
    apiName: 'x_1939459_cluck.PricingEngine',
    description:
        'Live pricing quotes for catalog items — eggs, chicks, tours, adoptions.',
    script: Now.include('../../server/PricingEngine.server.js'),
})
