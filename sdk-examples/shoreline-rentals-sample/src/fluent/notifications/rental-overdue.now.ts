import { EmailNotification } from '@servicenow/sdk/core'

export const rentalOverdueNotification = EmailNotification({
    $id: Now.ID['notif_rental_overdue'],
    table: 'x_1939459_shorelin_rental_request',
    name: 'Shoreline - Rental Overdue',
    description: 'Friendly nudge when a rental becomes overdue',
    active: true,
    triggerConditions: {
        onRecordInsert: false,
        onRecordUpdate: true,
        condition: 'rental_status=overdue',
    },
    recipientDetails: {
        recipientFields: ['opened_by'],
    },
    emailContent: {
        contentType: 'text/html',
        subject: "Heads up — your Shoreline rental \${number} is overdue",
        messageHtml: `
<p>Hi \${customer_name},</p>
<p>Our records show your rental <strong>\${number}</strong> was due back by
\${reservation_end}. Late fees accrue at $10/hour after a 15-minute grace period.</p>
<p>Please drop it back at <strong>\${pickup_location}</strong> as soon as you can,
or reply to this email if something came up.</p>
<p>— The Shoreline Crew</p>
        `,
    },
})
