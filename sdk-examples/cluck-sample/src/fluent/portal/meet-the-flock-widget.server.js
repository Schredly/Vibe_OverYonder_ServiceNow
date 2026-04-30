(function () {
    data.hens = []
    var gr = new GlideRecord('x_1939459_cluck_bird')
    gr.addQuery('is_adoptable', true)
    gr.addQuery('status', 'active')
    gr.orderByDesc('personality_score')
    gr.orderBy('name')
    gr.setLimit(24)
    gr.query()

    while (gr.next()) {
        var hatched = gr.getValue('hatched_date')
        var hatchedLabel = ''
        if (hatched) {
            var parts = String(hatched).split('-')
            if (parts.length === 3) {
                var monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
                var monthIdx = parseInt(parts[1], 10) - 1
                if (monthIdx >= 0 && monthIdx < 12) {
                    hatchedLabel = monthNames[monthIdx] + ' ' + parts[0]
                }
            }
        }

        data.hens.push({
            sys_id: gr.getUniqueValue(),
            tag_id: gr.getValue('tag_id'),
            name: gr.getValue('name'),
            breed: gr.getDisplayValue('breed'),
            sex: gr.getDisplayValue('sex'),
            egg_color: gr.getValue('egg_color_observed'),
            lifetime_eggs: parseInt(gr.getValue('lifetime_eggs'), 10) || 0,
            personality: parseFloat(gr.getValue('personality_score')) || 0,
            bio: gr.getValue('bio'),
            photo_url: gr.getValue('photo_url'),
            hatched: hatchedLabel,
            coop_name: gr.getDisplayValue('flock'),
            sponsored: !!gr.getValue('adoption_sponsor'),
            sponsored_by: gr.getDisplayValue('adoption_sponsor'),
        })
    }

    data.total = data.hens.length
    data.available = data.hens.filter(function (h) {
        return !h.sponsored
    }).length
})()
