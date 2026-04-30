/**
 * PricingEngine — server-side pricing helpers. Live quote endpoints for
 * the catalog / widgets.
 */
var PricingEngine = Class.create()
PricingEngine.prototype = {
    initialize: function () {},

    quoteEggs: function (dozens, grade, delivery) {
        dozens = parseInt(dozens, 10) || 0
        grade = grade || 'large'
        delivery = delivery || 'pickup'
        var priceTable = {
            jumbo: 9.5,
            xlarge: 8.5,
            large: 7.5,
            medium: 6.5,
            mixed: 8,
        }
        var feeTable = {
            pickup: 0,
            farm_stand: 0,
            farmers_market: 0,
            local_delivery: 5,
        }
        var subtotal = dozens * (priceTable[grade] || 7.5)
        var fee = feeTable[delivery] || 0
        return {
            dozens: dozens,
            grade: grade,
            delivery: delivery,
            subtotal: Math.round(subtotal * 100) / 100,
            fee: fee,
            total: Math.round((subtotal + fee) * 100) / 100,
        }
    },

    quoteChicks: function (breedId, qty) {
        qty = parseInt(qty, 10) || 0
        var base = 6
        var breedName = ''
        var rare = false
        if (breedId) {
            var b = new GlideRecord('x_1939459_cluck_breed')
            if (b.get(breedId)) {
                breedName = b.getValue('name')
                if (
                    b.getValue('heritage') === 'true' ||
                    b.getValue('egg_color') === 'blue' ||
                    b.getValue('egg_color') === 'chocolate' ||
                    b.getValue('egg_color') === 'green'
                ) {
                    base = 12
                    rare = true
                }
            }
        }
        return {
            breedName: breedName,
            qty: qty,
            unitPrice: base,
            premium: rare,
            subtotal: base * qty,
        }
    },

    quoteTour: function (party, withHunt) {
        party = parseInt(party, 10) || 1
        var base = party * 15
        var hunt = withHunt ? party * 10 : 0
        return {
            party: party,
            eggHunt: !!withHunt,
            base: base,
            hunt: hunt,
            subtotal: base + hunt,
        }
    },

    quoteAdoption: function () {
        return { subtotal: 120, note: 'Annual sponsorship' }
    },

    type: 'PricingEngine',
}
