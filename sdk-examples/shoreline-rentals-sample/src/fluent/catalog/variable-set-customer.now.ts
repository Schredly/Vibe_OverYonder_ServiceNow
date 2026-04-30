import {
    EmailVariable,
    SingleLineTextVariable,
    VariableSet,
} from '@servicenow/sdk/core'

/**
 * Reusable customer-contact variable set. Shared by every catalog item so
 * the portal experience feels consistent and changing a question here
 * updates every item at once.
 */
export const customerContactVariableSet = VariableSet({
    $id: Now.ID['varset_customer_contact'],
    title: 'Customer Contact',
    description: 'Captures who the rental is for and how to reach them.',
    type: 'singleRow',
    layout: '2across',
    displayTitle: true,
    order: 100,
    variables: {
        customer_name: SingleLineTextVariable({
            question: 'Full Name',
            order: 100,
            mandatory: true,
        }),
        customer_email: EmailVariable({
            question: 'Email',
            order: 200,
            mandatory: true,
        }),
        customer_phone: SingleLineTextVariable({
            question: 'Phone',
            order: 300,
            mandatory: true,
        }),
        member_number: SingleLineTextVariable({
            question: 'Member # (optional — for discount)',
            order: 400,
        }),
    },
})
