import {
    CatalogItem,
    MultiLineTextVariable,
    ReferenceVariable,
    SingleLineTextVariable,
    YesNoVariable,
} from '@servicenow/sdk/core'
import { cluckServiceCatalog } from './catalog-category.now'
import { customerContactVariableSet } from './variable-set-customer.now'

/**
 * Adopt-a-Hen — the crown jewel. Customer sponsors a specific named hen for
 * $120/year. They get: a printed photo certificate, a monthly email with her
 * production + personality updates, and a dozen of her eggs each quarter.
 *
 * The reference_qual_condition filters to adoptable + unsponsored hens only.
 */
export const adoptAHenCatalogItem = CatalogItem({
    $id: Now.ID['cat_item_adopt_hen'],
    name: 'Adopt-a-Hen (Annual Sponsorship)',
    shortDescription:
        'Sponsor one of our named hens for a year — photo updates, her eggs, a farm-visit invite.',
    description: `Become a hen's official sponsor for a year.

What you get:
  • A printed photo certificate with your hen's name, breed, and bio
  • Monthly email update: how many eggs she laid, quirky behavior notes, seasonal photos
  • A dozen of her eggs (or her flock's eggs) each quarter
  • An invite to the annual "Sponsor Day" farm brunch
  • First dibs if she goes broody and hatches chicks

Every hen deserves a fan club. Pick yours.`,
    availability: 'both',
    order: 300,
    catalogs: [cluckServiceCatalog],
    requestMethod: 'order',
    hideAddToCart: false,
    hideQuantitySelector: true,
    visibleStandalone: true,
    variableSets: [{ variableSet: customerContactVariableSet, order: 0 }],
    variables: {
        hen: ReferenceVariable({
            question: 'Choose Your Hen',
            order: 500,
            mandatory: true,
            referenceTable: 'x_1939459_cluck_bird',
            useReferenceQualifier: 'simple',
            referenceQualCondition:
                'is_adoptable=true^adoption_sponsorISEMPTY^status=active',
        }),
        gift_sponsorship: YesNoVariable({
            question: 'Is this a gift?',
            order: 600,
            defaultValue: false,
        }),
        recipient_name: SingleLineTextVariable({
            question: 'Gift recipient name (optional)',
            order: 700,
        }),
        certificate_message: MultiLineTextVariable({
            question: 'Message for the certificate (optional)',
            order: 800,
        }),
        ship_certificate: YesNoVariable({
            question: 'Ship a printed photo certificate?',
            order: 900,
            defaultValue: true,
        }),
        newsletter_opt_in: YesNoVariable({
            question: 'Opt in to monthly hen updates?',
            order: 1000,
            defaultValue: true,
        }),
    },
})
