import {
    EmailVariable,
    SingleLineTextVariable,
    VariableSet,
} from '@servicenow/sdk/core'

/**
 * Shared customer-contact variable set — used by every Cluckworks catalog item.
 */
export const customerContactVariableSet = VariableSet({
    $id: Now.ID['varset_cluck_customer'],
    title: 'Customer Info',
    description: 'Who the order is for and how to reach you.',
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
        customer_zip: SingleLineTextVariable({
            question: 'Zip Code (for delivery radius check)',
            order: 400,
        }),
    },
})
