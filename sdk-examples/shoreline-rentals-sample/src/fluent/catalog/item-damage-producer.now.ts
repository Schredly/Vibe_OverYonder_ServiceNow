import {
    CatalogItemRecordProducer,
    MultiLineTextVariable,
    ReferenceVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { shorelineServiceCatalog } from './catalog-category.now'

/**
 * Record producer — creates a damage report directly (no RITM). Lets a
 * customer self-report that they damaged or lost something.
 */
export const damageReportProducer = CatalogItemRecordProducer({
    $id: Now.ID['rp_damage_report'],
    name: 'Report Damage or Lost Item',
    shortDescription: 'Damaged or lost a rental? Let us know right away.',
    description:
        "Honest self-reporting usually means a smaller fee — tell us what happened and we'll get back to you.",
    table: 'x_1939459_shorelin_damage_report',
    state: 'published',
    availability: 'both',
    catalogs: [shorelineServiceCatalog],
    redirectUrl: 'generatedRecord',
    canCancel: true,
    variables: {
        rental_request: ReferenceVariable({
            question: 'Rental Request (if you have the RENT number)',
            order: 100,
            referenceTable: 'x_1939459_shorelin_rental_request',
            mapToField: true,
            field: 'rental_request',
        }),
        equipment: ReferenceVariable({
            question: 'Equipment',
            order: 200,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_equipment',
            mapToField: true,
            field: 'equipment',
        }),
        severity: SelectBoxVariable({
            question: 'Severity',
            order: 300,
            mandatory: true,
            choices: {
                cosmetic: { label: 'Cosmetic (scuff / scratch)' },
                minor: { label: 'Minor damage, still usable' },
                moderate: { label: 'Moderate damage' },
                major: { label: 'Major damage' },
                total_loss: { label: 'Lost / totaled' },
            },
            includeNone: false,
            mapToField: true,
            field: 'severity',
        }),
        short_description: SingleLineTextVariable({
            question: 'One-line summary',
            order: 400,
            mandatory: true,
            mapToField: true,
            field: 'short_description',
        }),
        incident_notes: MultiLineTextVariable({
            question: 'What happened?',
            order: 500,
            mandatory: true,
            mapToField: true,
            field: 'incident_notes',
        }),
        photo_url: SingleLineTextVariable({
            question: 'Photo URL (optional)',
            order: 600,
            mapToField: true,
            field: 'photo_url',
        }),
    },
})
