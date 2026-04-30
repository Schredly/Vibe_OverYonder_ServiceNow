(function () {
    // Pull featured inventory for the portal splash card.
    data.items = []
    var gr = new GlideRecord('x_1939459_shorelin_equipment')
    gr.addQuery('active', true)
    gr.addQuery('featured', true)
    gr.addQuery('available_quantity', '>', 0)
    gr.orderBy('name')
    gr.setLimit(12)
    gr.query()
    while (gr.next()) {
        data.items.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            category: gr.getDisplayValue('category'),
            location: gr.getDisplayValue('location'),
            available: parseInt(gr.getValue('available_quantity'), 10),
            full_day_rate: parseFloat(gr.getValue('full_day_rate') || '0'),
            deposit: parseFloat(gr.getValue('deposit') || '0'),
            image_url: gr.getValue('image_url'),
            requires_waiver: gr.getValue('requires_waiver') === 'true',
        })
    }

    // Quick stats for the header strip.
    var total = new GlideAggregate('x_1939459_shorelin_equipment')
    total.addQuery('active', true)
    total.addAggregate('SUM', 'available_quantity')
    total.query()
    data.available_count = 0
    if (total.next()) {
        data.available_count =
            parseInt(total.getAggregate('SUM', 'available_quantity'), 10) || 0
    }

    var cats = new GlideAggregate('x_1939459_shorelin_category')
    cats.addAggregate('COUNT')
    cats.query()
    data.category_count = 0
    if (cats.next())
        data.category_count = parseInt(cats.getAggregate('COUNT'), 10) || 0
})()
