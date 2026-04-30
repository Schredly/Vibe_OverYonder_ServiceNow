import { EmailNotification } from '@servicenow/sdk/core'

export const orderConfirmedNotification = EmailNotification({
    $id: Now.ID['notif_order_confirmed'],
    table: 'x_1939459_cluck_order',
    name: 'Cluck - Order Confirmed',
    description: 'Confirms a new egg/chick/tour/adoption order to the customer',
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
        subject: 'Your Cluckworks order ${number} is confirmed',
        messageHtml: `
<h2>Thanks, \${customer_name}! 🐔</h2>
<p>Your order is in the book. Here's what we've got:</p>
<ul>
    <li><strong>Order #:</strong> \${number}</li>
    <li><strong>Type:</strong> \${order_type}</li>
    <li><strong>Delivery:</strong> \${delivery_type} on \${delivery_date}</li>
    <li><strong>Total:</strong> $\${total}</li>
</ul>
<p>The hens are pleased with your support. We'll be in touch when your order is ready.</p>
<p>— The Cluckworks Farm Crew</p>
        `,
    },
})
