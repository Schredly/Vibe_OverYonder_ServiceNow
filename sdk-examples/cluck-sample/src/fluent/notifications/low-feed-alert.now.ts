import { EmailNotification } from '@servicenow/sdk/core'

export const lowFeedAlertNotification = EmailNotification({
    $id: Now.ID['notif_low_feed'],
    table: 'x_1939459_cluck_feed',
    name: 'Cluck - Low Feed Alert',
    description: 'Notifies farmhands when a feed SKU drops below reorder threshold',
    active: true,
    triggerConditions: {
        onRecordInsert: false,
        onRecordUpdate: true,
        condition: 'on_hand_bagsLESS THANreorder_threshold',
    },
    recipientDetails: {
        recipientFields: ['sys_created_by'],
        sendToCreator: true,
    },
    emailContent: {
        contentType: 'text/html',
        subject: 'Low feed: \${name} (\${on_hand_bags} bags left)',
        messageHtml: `
<h2>Feed running low</h2>
<p><strong>\${name}</strong> is down to \${on_hand_bags} bags (reorder threshold: \${reorder_threshold}).</p>
<p>A reorder task has been auto-opened. Check the feed table for details.</p>
<p>Supplier: \${supplier}<br/>Suggested reorder quantity: \${reorder_quantity} bags</p>
        `,
    },
})
