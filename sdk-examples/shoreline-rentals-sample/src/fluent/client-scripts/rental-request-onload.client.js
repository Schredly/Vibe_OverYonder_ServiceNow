function onLoad() {
    // Default the reservation window to "today 9am – today 5pm" if empty.
    var now = new Date()
    var start = new Date(now)
    start.setHours(9, 0, 0, 0)
    var end = new Date(now)
    end.setHours(17, 0, 0, 0)

    if (!g_form.getValue('reservation_start')) {
        g_form.setValue(
            'reservation_start',
            start.toISOString().slice(0, 19).replace('T', ' ')
        )
    }
    if (!g_form.getValue('reservation_end')) {
        g_form.setValue(
            'reservation_end',
            end.toISOString().slice(0, 19).replace('T', ' ')
        )
    }

    // Make actual_pickup / actual_return read-only until the rental is actually
    // picked up or returned.
    var status = g_form.getValue('rental_status')
    g_form.setReadOnly('actual_pickup', status === 'reserved' || status === '')
    g_form.setReadOnly('actual_return', status !== 'returned' && status !== 'lost')
}
