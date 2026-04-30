import { GlideAggregate, GlideDateTime, GlideRecord, gs } from '@servicenow/glide'

/**
 * Scripted REST handler — GET /api/x_1939459_cluck/egg_availability
 *
 * Optional query params:
 *   flock      — scope to a specific flock sys_id
 *   days       — rolling window (default today only)
 *   grade      — filter to a specific grade
 *
 * Returns today's (or window) egg stock summary, suitable for an external
 * site or fridge display.
 */
export function getEggAvailability(request: any, response: any) {
    const flockParam = request.queryParams?.flock?.[0]
    const daysParam = parseInt(request.queryParams?.days?.[0] || '0', 10)
    const gradeParam = request.queryParams?.grade?.[0]

    const cutoff = new GlideDateTime()
    if (daysParam > 0) cutoff.addDaysUTC(-daysParam)
    else cutoff.setDisplayValueInternal(String(cutoff.getDate()) + ' 00:00:00')

    const log = new GlideRecord('x_1939459_cluck_egg_log')
    log.addQuery('log_date', '>=', String(cutoff.getDate()))
    if (flockParam) log.addQuery('flock', flockParam)
    log.query()

    let total = 0
    let cracked = 0
    const grades: { [key: string]: number } = {
        jumbo: 0,
        xlarge: 0,
        large: 0,
        medium: 0,
        small: 0,
    }
    const flockBreakdown: { [key: string]: number } = {}
    while (log.next()) {
        const c = parseInt(log.getValue('count_collected'), 10) || 0
        const cr = parseInt(log.getValue('count_cracked'), 10) || 0
        total += c
        cracked += cr
        grades.jumbo += parseInt(log.getValue('count_jumbo'), 10) || 0
        grades.xlarge += parseInt(log.getValue('count_xlarge'), 10) || 0
        grades.large += parseInt(log.getValue('count_large'), 10) || 0
        grades.medium += parseInt(log.getValue('count_medium'), 10) || 0
        grades.small += parseInt(log.getValue('count_small'), 10) || 0

        const flockName = log.getDisplayValue('flock') || 'Unknown'
        flockBreakdown[flockName] = (flockBreakdown[flockName] || 0) + c
    }

    const sellable = Math.max(0, total - cracked)
    const payload: any = {
        as_of: new GlideDateTime().getDisplayValue(),
        window_days: daysParam || 1,
        total_collected: total,
        cracked: cracked,
        sellable: sellable,
        dozens_available: Math.floor(sellable / 12),
        by_grade: grades,
        by_flock: flockBreakdown,
    }
    if (gradeParam && grades[gradeParam] !== undefined) {
        payload.requested_grade = gradeParam
        payload.requested_grade_count = grades[gradeParam]
    }

    response.setStatus(200)
    response.setBody(payload)
}
