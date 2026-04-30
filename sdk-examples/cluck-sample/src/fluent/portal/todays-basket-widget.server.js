(function () {
    // Sum all egg_log rows with log_date = today
    var today = new GlideDateTime().getDate().getValue()
    data.as_of = new GlideDateTime().getDisplayValue()
    data.date = today
    data.grades = {
        jumbo: 0,
        xlarge: 0,
        large: 0,
        medium: 0,
        small: 0,
        doubleYolk: 0,
    }
    data.total = 0
    data.cracked = 0

    var log = new GlideRecord('x_1939459_cluck_egg_log')
    log.addQuery('log_date', today)
    log.query()
    while (log.next()) {
        var c = parseInt(log.getValue('count_collected'), 10) || 0
        var cr = parseInt(log.getValue('count_cracked'), 10) || 0
        data.total += c
        data.cracked += cr
        data.grades.jumbo += parseInt(log.getValue('count_jumbo'), 10) || 0
        data.grades.xlarge += parseInt(log.getValue('count_xlarge'), 10) || 0
        data.grades.large += parseInt(log.getValue('count_large'), 10) || 0
        data.grades.medium += parseInt(log.getValue('count_medium'), 10) || 0
        data.grades.small += parseInt(log.getValue('count_small'), 10) || 0
        data.grades.doubleYolk +=
            parseInt(log.getValue('count_double_yolk'), 10) || 0
    }
    data.sellable = Math.max(0, data.total - data.cracked)
    data.dozens = Math.floor(data.sellable / 12)

    // Flock count for "N happy hens"
    var agg = new GlideAggregate('x_1939459_cluck_flock')
    agg.addQuery('status', 'active')
    agg.addAggregate('SUM', 'current_count')
    agg.query()
    data.happy_hens = 0
    if (agg.next())
        data.happy_hens =
            parseInt(agg.getAggregate('SUM', 'current_count'), 10) || 0
})()
