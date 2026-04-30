import { EmailNotification } from '@servicenow/sdk/core'

export const csaRenewalNotification = EmailNotification({
    $id: Now.ID['notif_csa_renewal'],
    table: 'x_1939459_cluck_subscription',
    name: 'Cluck - CSA Renewal Reminder',
    description: 'Reminds a CSA member their subscription is ending soon',
    active: true,
    triggerConditions: {
        onRecordInsert: false,
        onRecordUpdate: true,
        condition: 'statusCHANGESTOpaused',
    },
    recipientDetails: {
        recipientFields: ['customer.email'],
    },
    emailContent: {
        contentType: 'text/html',
        subject: 'Your Cluckworks CSA subscription is paused',
        messageHtml: `
<h2>Hi there,</h2>
<p>Your CSA subscription (\${frequency}, \${dozen_count} dozen per drop) is now paused.</p>
<p>Drop us a line when you're ready to un-pause — the hens will be waiting.</p>
<p>— The Cluckworks Farm Crew</p>
        `,
    },
})
