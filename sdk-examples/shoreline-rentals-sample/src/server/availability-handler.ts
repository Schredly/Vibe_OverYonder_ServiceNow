import { GlideRecord } from '@servicenow/glide'

/**
 * GET /api/x_1939459_shorelin/availability?category=<sys_id>&location=<sys_id>
 *
 * Returns a JSON array of rentable inventory with current availability.
 * Designed for external integrations (kiosk, partner hotel concierge apps).
 */
export function listAvailability(request: any, response: any) {
    const category = request.queryParams.category
    const location = request.queryParams.location

    const gr = new GlideRecord('x_1939459_shorelin_equipment')
    gr.addQuery('active', true)
    if (category) gr.addQuery('category', category)
    if (location) gr.addQuery('location', location)
    gr.orderBy('name')
    gr.query()

    const results: Record<string, unknown>[] = []
    while (gr.next()) {
        results.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('name'),
            sku: gr.getValue('sku'),
            category: gr.getDisplayValue('category'),
            location: gr.getDisplayValue('location'),
            available: parseInt(gr.getValue('available_quantity'), 10) || 0,
            total: parseInt(gr.getValue('total_quantity'), 10) || 0,
            hourly_rate: parseFloat(gr.getValue('hourly_rate') || '0'),
            half_day_rate: parseFloat(gr.getValue('half_day_rate') || '0'),
            full_day_rate: parseFloat(gr.getValue('full_day_rate') || '0'),
            weekly_rate: parseFloat(gr.getValue('weekly_rate') || '0'),
            deposit: parseFloat(gr.getValue('deposit') || '0'),
            condition: gr.getValue('condition'),
            featured: gr.getValue('featured') === 'true',
            requires_waiver: gr.getValue('requires_waiver') === 'true',
        })
    }
    response.setBody({ count: results.length, items: results })
}
