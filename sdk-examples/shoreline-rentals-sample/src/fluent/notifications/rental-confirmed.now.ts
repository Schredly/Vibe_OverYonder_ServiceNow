import { EmailNotification } from '@servicenow/sdk/core'

/**
 * Booking-confirmed email — fires when a rental request is inserted OR when
 * rental_status transitions to 'reserved' (e.g., picked-up-then-re-reserved).
 */
export const rentalConfirmedNotification = EmailNotification({
    $id: Now.ID['notif_rental_confirmed'],
    table: 'x_1939459_shorelin_rental_request',
    name: 'Shoreline - Rental Confirmed',
    description: 'Confirms a new rental reservation to the customer',
    active: true,
    triggerConditions: {
        onRecordInsert: true,
        onRecordUpdate: false,
    },
    recipientDetails: {
        recipientFields: ['opened_by'],
        sendToCreator: true,
    },
    emailContent: {
        contentType: 'text/html',
        subject: 'Your Shoreline rental ${number} is confirmed',
        messageHtml: `
<h2>You're all set, \${customer_name}!</h2>
<p>Your rental is confirmed. Here are the details:</p>
<ul>
    <li><strong>Rental #:</strong> \${number}</li>
    <li><strong>Pickup Location:</strong> \${pickup_location}</li>
    <li><strong>Start:</strong> \${reservation_start}</li>
    <li><strong>End:</strong> \${reservation_end}</li>
    <li><strong>Total:</strong> $\${total_amount}</li>
    <li><strong>Deposit held:</strong> $\${deposit_amount}</li>
</ul>
<p>See you at the beach!</p>
<p>— The Shoreline Crew</p>
        `,
    },
})
