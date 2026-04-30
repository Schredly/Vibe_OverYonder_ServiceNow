/**
 * FlockAnalytics — server-side analytics helpers for flocks + eggs + hens.
 *
 * Methods:
 *   getFlockStats(flock_sys_id, days)         -> stats object
 *   getTotalAvailableToday()                  -> today's egg roll-up
 *   getAdoptableHens()                        -> list of adoptable hen summaries
 *
 * Called from portal widgets and other server-side code.
 */
var FlockAnalytics = Class.create()
FlockAnalytics.prototype = {
    initialize: function () {},

    getFlockStats: function (flockId, days) {
        days = parseInt(days, 10) || 30
        if (!flockId) return { error: 'flock_sys_id required' }
        var flock = new GlideRecord('x_1939459_cluck_flock')
        if (!flock.get(flockId)) return { error: 'flock not found' }
        var birds = parseInt(flock.getValue('current_count'), 10) || 0
        if (!birds) return { rate: 0, fcr: 0, mortality: 0, totalEggs: 0, birds: 0 }

        var cutoff = new GlideDateTime()
        cutoff.addDaysUTC(-days)
        var eggs = 0
        var cracked = 0
        var log = new GlideRecord('x_1939459_cluck_egg_log')
        log.addQuery('flock', flockId)
        log.addQuery('log_date', '>=', cutoff.getDate())
        log.query()
        while (log.next()) {
            eggs += parseInt(log.getValue('count_collected'), 10) || 0
            cracked += parseInt(log.getValue('count_cracked'), 10) || 0
        }

        var rate = (eggs / (birds * days)) * 100
        rate = Math.round(rate * 10) / 10

        var dead = new GlideAggregate('x_1939459_cluck_bird')
        dead.addQuery('flock', flockId)
        dead.addQuery('status', 'deceased')
        dead.addAggregate('COUNT')
        dead.query()
        var deadCount = 0
        if (dead.next()) {
            deadCount = parseInt(dead.getAggregate('COUNT'), 10) || 0
        }
        var mortality =
            birds + deadCount > 0 ? (deadCount / (birds + deadCount)) * 100 : 0
        mortality = Math.round(mortality * 10) / 10

        var feedKg = eggs * 0.12
        var fcrEstimate = eggs > 0 ? feedKg / (eggs * 0.06) : 0
        fcrEstimate = Math.round(fcrEstimate * 100) / 100

        return {
            flock: flock.getValue('name'),
            birds: birds,
            totalEggs: eggs,
            cracked: cracked,
            rate: rate,
            mortality: mortality,
            fcr: fcrEstimate,
            windowDays: days,
        }
    },

    getTotalAvailableToday: function () {
        var log = new GlideRecord('x_1939459_cluck_egg_log')
        var today = new GlideDateTime().getDate()
        log.addQuery('log_date', today)
        log.query()
        var total = 0
        var grades = {
            jumbo: 0,
            xlarge: 0,
            large: 0,
            medium: 0,
            small: 0,
            doubleYolk: 0,
        }
        while (log.next()) {
            var collected = parseInt(log.getValue('count_collected'), 10) || 0
            var cr = parseInt(log.getValue('count_cracked'), 10) || 0
            total += Math.max(0, collected - cr)
            grades.jumbo += parseInt(log.getValue('count_jumbo'), 10) || 0
            grades.xlarge += parseInt(log.getValue('count_xlarge'), 10) || 0
            grades.large += parseInt(log.getValue('count_large'), 10) || 0
            grades.medium += parseInt(log.getValue('count_medium'), 10) || 0
            grades.small += parseInt(log.getValue('count_small'), 10) || 0
            grades.doubleYolk +=
                parseInt(log.getValue('count_double_yolk'), 10) || 0
        }
        return {
            date: '' + today,
            totalEggs: total,
            dozensAvailable: Math.floor(total / 12),
            byGrade: grades,
        }
    },

    getAdoptableHens: function () {
        var results = []
        var birds = new GlideRecord('x_1939459_cluck_bird')
        birds.addQuery('is_adoptable', true)
        birds.addQuery('status', 'active')
        birds.addNullQuery('adoption_sponsor')
        birds.orderBy('name')
        birds.setLimit(24)
        birds.query()
        while (birds.next()) {
            results.push({
                sys_id: birds.getUniqueValue(),
                name: birds.getValue('name'),
                tag_id: birds.getValue('tag_id'),
                breed: birds.getDisplayValue('breed'),
                egg_color: birds.getValue('egg_color_observed'),
                lifetime_eggs: parseInt(birds.getValue('lifetime_eggs'), 10) || 0,
                personality: parseFloat(birds.getValue('personality_score')) || 0,
                bio: birds.getValue('bio'),
                photo_url: birds.getValue('photo_url'),
            })
        }
        return { count: results.length, hens: results }
    },

    type: 'FlockAnalytics',
}
