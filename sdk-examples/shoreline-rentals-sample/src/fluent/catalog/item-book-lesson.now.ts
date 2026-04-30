import {
    CatalogItem,
    DateTimeVariable,
    MultiLineTextVariable,
    ReferenceVariable,
    SelectBoxVariable,
    SingleLineTextVariable,
} from '@servicenow/sdk/core'
import { shorelineServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Book an instructor-led experience: surf lesson, SUP yoga, snorkel tour, etc.
 */
export const bookLessonCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_book_lesson'],
    name: 'Book a Lesson',
    shortDescription:
        'Surf, SUP, snorkel, sandcastle — book a pro and level up your beach day.',
    description:
        'Choose your experience, pick a date and time, tell us how many people. Gear is always included. Minimum age and skill levels apply per lesson.',
    availability: 'both',
    order: 300,
    catalogs: [shorelineServiceCatalog],
    visibleBundle: true,
    visibleGuide: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        lesson: ReferenceVariable({
            question: 'Lesson',
            order: 500,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_lesson',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        format: SelectBoxVariable({
            question: 'Format',
            order: 600,
            mandatory: true,
            defaultValue: 'group',
            choices: {
                group: { label: 'Group' },
                private: { label: 'Private' },
            },
            includeNone: false,
        }),
        headcount: SingleLineTextVariable({
            question: 'Number of Participants',
            order: 700,
            mandatory: true,
            defaultValue: '1',
        }),
        preferred_start: DateTimeVariable({
            question: 'Preferred Start',
            order: 800,
            mandatory: true,
        }),
        pickup_location: ReferenceVariable({
            question: 'Meet at Location',
            order: 900,
            mandatory: true,
            referenceTable: 'x_1939459_shorelin_location',
            useReferenceQualifier: 'simple',
            referenceQualCondition: 'active=true',
        }),
        special_requests: MultiLineTextVariable({
            question: 'Allergies, accessibility, or anything the instructor should know',
            order: 1000,
        }),
    },
})
