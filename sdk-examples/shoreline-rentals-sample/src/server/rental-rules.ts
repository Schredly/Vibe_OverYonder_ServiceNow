import { GlideDateTime, GlideRecord, gs } from '@servicenow/glide'

/**
 * Inventory + pricing logic for rental requests. All functions are exported so
 * Fluent BusinessRule declarations can reference them by name — the SDK emits
 * the glue into the generated `sys_script.script` field.
 */

const LATE_GRACE_MINUTES = 15
const LATE_FEE_PER_HOUR = 10

// ---------- Helpers ----------

function hoursBetween(startStr: string, endStr: string): number {
    if (!startStr || !endStr) return 0
    const start = new GlideDateTime(startStr)
    const end = new GlideDateTime(endStr)
    const ms = end.getNumericValue() - start.getNumericValue()
    return Math.max(0, ms / 1000 / 60 / 60)
}

function getDailyRate(equipment: GlideRecord, tier: string): number {
    switch (tier) {
        case 'hourly':
            return parseFloat(equipment.getValue('hourly_rate') || '0')
        case 'half_day':
            return parseFloat(equipment.getValue('half_day_rate') || '0')
        case 'weekly':
            return parseFloat(equipment.getValue('weekly_rate') || '0')
        case 'full_day':
        default:
            return parseFloat(equipment.getValue('full_day_rate') || '0')
    }
}

// ---------- Pricing ----------

/**
 * Before-insert & before-update: compute base_amount, discount_amount, total_amount.
 * Respects member tier discounts (via the `member` reference).
 */
export function calculatePricing(current: GlideRecord) {
    const tier = current.getValue('pricing_tier') || 'full_day'
    const qty = parseInt(current.getValue('quantity'), 10) || 1
    let base = 0

    // ----- Bundle pricing takes precedence -----
    const bundleId = current.getValue('bundle')
    if (bundleId) {
        const bundle = new GlideRecord('x_1939459_shorelin_bundle')
        if (bundle.get(bundleId)) {
            base = parseFloat(bundle.getValue('bundle_price') || '0')
            current.setValue('pricing_tier', 'bundle')
        }
    } else {
        // ----- Single-equipment pricing -----
        const equipmentId = current.getValue('equipment')
        if (equipmentId) {
            const equipment = new GlideRecord('x_1939459_shorelin_equipment')
            if (equipment.get(equipmentId)) {
                const rate = getDailyRate(equipment, tier)
                if (tier === 'hourly') {
                    const hrs = hoursBetween(
                        current.getValue('reservation_start'),
                        current.getValue('reservation_end')
                    )
                    base = rate * Math.max(1, Math.ceil(hrs)) * qty
                } else if (tier === 'weekly') {
                    const weeks =
                        Math.ceil(
                            hoursBetween(
                                current.getValue('reservation_start'),
                                current.getValue('reservation_end')
                            ) / 168
                        ) || 1
                    base = rate * weeks * qty
                } else {
                    base = rate * qty
                }
                current.setValue(
                    'deposit_amount',
                    parseFloat(equipment.getValue('deposit') || '0') * qty
                )
            }
        }
    }

    // ----- Member discount -----
    let discount = 0
    const memberId = current.getValue('member')
    if (memberId) {
        const member = new GlideRecord('x_1939459_shorelin_membership')
        if (member.get(memberId)) {
            const pct = parseInt(member.getValue('discount_percent'), 10) || 0
            discount = (base * pct) / 100
        }
    }

    const lateFee = parseFloat(current.getValue('late_fee') || '0')
    const damageFee = parseFloat(current.getValue('damage_fee') || '0')

    current.setValue('base_amount', base)
    current.setValue('discount_amount', discount)
    current.setValue('total_amount', base - discount + lateFee + damageFee)
}

// ---------- Inventory ----------

export function onRentalReserved(current: GlideRecord) {
    const equipmentId = current.getValue('equipment')
    const bundleId = current.getValue('bundle')
    const qty = parseInt(current.getValue('quantity'), 10) || 1

    // Bundle: decrement one of each included piece.
    if (bundleId) {
        const bundle = new GlideRecord('x_1939459_shorelin_bundle')
        if (bundle.get(bundleId)) {
            const items: string[] = String(
                bundle.getValue('included_equipment') || ''
            )
                .split(',')
                .filter(Boolean)
            for (const itemId of items) {
                decrementEquipment(itemId, 1, current)
            }
        }
        return
    }

    if (!equipmentId) return
    decrementEquipment(equipmentId, qty, current)
}

function decrementEquipment(
    equipmentId: string,
    qty: number,
    current: GlideRecord
) {
    const equipment = new GlideRecord('x_1939459_shorelin_equipment')
    if (!equipment.get(equipmentId)) return
    const available = parseInt(equipment.getValue('available_quantity'), 10) || 0
    if (qty > available) {
        gs.addErrorMessage(
            'Only ' +
                available +
                ' of ' +
                equipment.getValue('name') +
                ' available right now. Please reduce quantity or pick another item.'
        )
        current.setAbortAction(true)
        return
    }
    equipment.setValue('available_quantity', available - qty)
    equipment.update()
}

export function onRentalReturned(current: GlideRecord, previous: GlideRecord) {
    const now = current.getValue('rental_status')
    const was = previous.getValue('rental_status')
    if (now === 'returned' && was !== 'returned') {
        restoreInventory(current)
        // Auto-calculate late fee on return.
        const expected = current.getValue('reservation_end')
        const actual =
            current.getValue('actual_return') || new GlideDateTime().getValue()
        const lateHrs = hoursBetween(expected, actual)
        const lateMins = lateHrs * 60
        if (lateMins > LATE_GRACE_MINUTES) {
            const fee =
                Math.ceil((lateMins - LATE_GRACE_MINUTES) / 60) *
                LATE_FEE_PER_HOUR
            current.setValue('late_fee', fee)
            gs.addInfoMessage('Late fee of $' + fee + ' applied.')
        }
        if (!current.getValue('actual_return')) {
            current.setValue('actual_return', new GlideDateTime().getValue())
        }
    }
    // Cancellation also restores inventory.
    if (now === 'canceled' && was !== 'canceled') {
        restoreInventory(current)
    }
}

function restoreInventory(current: GlideRecord) {
    const equipmentId = current.getValue('equipment')
    const bundleId = current.getValue('bundle')
    const qty = parseInt(current.getValue('quantity'), 10) || 1

    if (bundleId) {
        const bundle = new GlideRecord('x_1939459_shorelin_bundle')
        if (bundle.get(bundleId)) {
            const items: string[] = String(
                bundle.getValue('included_equipment') || ''
            )
                .split(',')
                .filter(Boolean)
            for (const itemId of items) {
                incrementEquipment(itemId, 1)
            }
        }
        return
    }
    if (!equipmentId) return
    incrementEquipment(equipmentId, qty)
}

function incrementEquipment(equipmentId: string, qty: number) {
    const equipment = new GlideRecord('x_1939459_shorelin_equipment')
    if (!equipment.get(equipmentId)) return
    const available = parseInt(equipment.getValue('available_quantity'), 10) || 0
    const total = parseInt(equipment.getValue('total_quantity'), 10) || 0
    equipment.setValue('available_quantity', Math.min(total, available + qty))
    equipment.update()
}

// ---------- Damage ----------

/**
 * When a damage report is saved with a non-waived fee, roll that fee onto the
 * linked rental so the total updates.
 */
export function propagateDamageFee(current: GlideRecord) {
    if (current.getValue('fee_waived') === 'true') return
    const rentalId = current.getValue('rental_request')
    if (!rentalId) return
    const rental = new GlideRecord('x_1939459_shorelin_rental_request')
    if (!rental.get(rentalId)) return
    const existing = parseFloat(rental.getValue('damage_fee') || '0')
    const fee = parseFloat(current.getValue('damage_fee') || '0')
    rental.setValue('damage_fee', existing + fee)
    rental.update()
    gs.info(
        'Shoreline: added $' +
            fee +
            ' damage fee to rental ' +
            rental.getValue('number')
    )
}

/**
 * Award loyalty points on rental return (1 point per $1 spent).
 */
export function awardLoyaltyPoints(
    current: GlideRecord,
    previous: GlideRecord
) {
    if (
        current.getValue('rental_status') !== 'returned' ||
        previous.getValue('rental_status') === 'returned'
    )
        return
    const memberId = current.getValue('member')
    if (!memberId) return
    const member = new GlideRecord('x_1939459_shorelin_membership')
    if (!member.get(memberId)) return
    const spent = parseFloat(current.getValue('total_amount') || '0')
    const points = parseInt(member.getValue('loyalty_points'), 10) || 0
    const lifetime = parseFloat(member.getValue('lifetime_spend') || '0')
    member.setValue('loyalty_points', points + Math.floor(spent))
    member.setValue('lifetime_spend', lifetime + spent)
    member.update()
}
