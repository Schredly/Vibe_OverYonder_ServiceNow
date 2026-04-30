import {
    CatalogItemRecordProducer,
    MultiLineTextVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'

/**
 * Record producer — creates an incident directly. Customer-facing surface
 * for reporting egg quality issues, predator sightings, delivery problems.
 */
export const reportIssueProducer = CatalogItemRecordProducer({
    $id: Now.ID['rp_report_issue'],
    name: 'Report an Issue',
    shortDescription: 'Bad egg? Saw a hawk? Something else? Let us know.',
    description:
        'Honest feedback makes the farm better. Quality issues get a same-week refund; predator sightings help us keep the flock safe.',
    table: 'x_1939459_cluck_incident',
    state: 'published',
    availability: 'both',
    catalogs: [cluckServiceCatalog],
    redirectUrl: 'generatedRecord',
    canCancel: true,
    variables: {
        incident_type: SelectBoxVariable({
            question: 'Issue Type',
            order: 100,
            mandatory: true,
            choices: {
                quality: { label: 'Egg quality issue (cracked, stale, off)' },
                delivery: { label: 'Delivery problem' },
                predator: { label: 'Predator sighting near the farm' },
                other: { label: 'Something else' },
            },
            includeNone: false,
            mapToField: true,
            field: 'incident_type',
        }),
        severity: SelectBoxVariable({
            question: 'Severity',
            order: 200,
            mandatory: true,
            choices: {
                minor: { label: 'Minor (FYI)' },
                moderate: { label: 'Moderate (I\'d like a resolution)' },
                major: { label: 'Major (urgent)' },
            },
            includeNone: false,
            mapToField: true,
            field: 'severity',
        }),
        short_description: SingleLineTextVariable({
            question: 'One-line summary',
            order: 300,
            mandatory: true,
            mapToField: true,
            field: 'short_description',
        }),
        evidence_notes: MultiLineTextVariable({
            question: 'What happened?',
            order: 400,
            mandatory: true,
            mapToField: true,
            field: 'evidence_notes',
        }),
        photo_url: SingleLineTextVariable({
            question: 'Photo URL (optional)',
            order: 500,
            mapToField: true,
            field: 'photo_url',
        }),
    },
})
