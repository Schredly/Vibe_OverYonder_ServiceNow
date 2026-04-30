import { gs, GlideRecord } from '@servicenow/glide'

/**
 * When a checkout is created, reduce available quantity on the equipment record
 */
export function onCheckoutCreated(current: GlideRecord) {
    const equipmentId = current.getValue('equipment')
    const qty = parseInt(current.getValue('quantity'), 10)

    const equipment = new GlideRecord('x_beachbum_equipment')
    if (equipment.get(equipmentId)) {
        const available = parseInt(equipment.getValue('available_quantity'), 10)
        if (qty > available) {
            gs.addErrorMessage('Not enough equipment available. Only ' + available + ' left.')
            current.setAbortAction(true)
            return
        }
        equipment.setValue('available_quantity', available - qty)
        equipment.update()
        gs.info('Beach Bum: Checked out ' + qty + ' ' + equipment.getValue('name'))
    }
}

/**
 * When a checkout is returned, restore available quantity on the equipment record
 */
export function onCheckoutReturned(current: GlideRecord, previous: GlideRecord) {
    const currentStatus = current.getValue('status')
    const previousStatus = previous.getValue('status')

    if (currentStatus === 'returned' && previousStatus !== 'returned') {
        const equipmentId = current.getValue('equipment')
        const qty = parseInt(current.getValue('quantity'), 10)

        const equipment = new GlideRecord('x_beachbum_equipment')
        if (equipment.get(equipmentId)) {
            const available = parseInt(equipment.getValue('available_quantity'), 10)
            equipment.setValue('available_quantity', available + qty)
            equipment.update()
            gs.info('Beach Bum: Returned ' + qty + ' ' + equipment.getValue('name'))
        }
    }
}
