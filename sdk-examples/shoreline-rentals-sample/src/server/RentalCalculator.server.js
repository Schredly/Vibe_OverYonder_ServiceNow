/**
 * RentalCalculator — reusable server-side pricing + availability helpers.
 * Called from business rules / REST handlers / other server scripts.
 */
var RentalCalculator = Class.create()
RentalCalculator.prototype = {
    initialize: function () {},

    /**
     * Return available quantity for an equipment sys_id, or 0 if missing.
     */
    getAvailability: function (equipmentId) {
        var gr = new GlideRecord('x_1939459_shorelin_equipment')
        if (!equipmentId || !gr.get(equipmentId)) return 0
        return parseInt(gr.getValue('available_quantity'), 10) || 0
    },

    /**
     * Quote a single-item rental. Returns an object with base, discount, total.
     */
    quoteRental: function (equipmentId, pricingTier, quantity, memberNumber) {
        var tier = pricingTier || 'full_day'
        var qty = parseInt(quantity || '1', 10)
        var gr = new GlideRecord('x_1939459_shorelin_equipment')
        if (!equipmentId || !gr.get(equipmentId)) return null

        var rate = 0
        switch (tier) {
            case 'hourly':
                rate = parseFloat(gr.getValue('hourly_rate') || '0')
                break
            case 'half_day':
                rate = parseFloat(gr.getValue('half_day_rate') || '0')
                break
            case 'weekly':
                rate = parseFloat(gr.getValue('weekly_rate') || '0')
                break
            case 'full_day':
            default:
                rate = parseFloat(gr.getValue('full_day_rate') || '0')
        }
        var base = rate * qty
        var discount = 0
        if (memberNumber) {
            var mgr = new GlideRecord('x_1939459_shorelin_membership')
            mgr.addQuery('member_number', memberNumber)
            mgr.addQuery('active', true)
            mgr.setLimit(1)
            mgr.query()
            if (mgr.next()) {
                var pct = parseInt(mgr.getValue('discount_percent'), 10) || 0
                discount = (base * pct) / 100
            }
        }
        return {
            equipment: gr.getValue('name'),
            base: base,
            discount: discount,
            deposit: parseFloat(gr.getValue('deposit') || '0') * qty,
            total: base - discount,
            available: parseInt(gr.getValue('available_quantity'), 10) || 0,
        }
    },

    /**
     * True if `qty` units of this equipment are currently free.
     */
    isAvailableForWindow: function (equipmentId, qty) {
        return this.getAvailability(equipmentId) >= qty
    },

    type: 'RentalCalculator',
}
