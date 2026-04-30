import { EmailNotification } from '@servicenow/sdk/core'

export const damageFeeNotification = EmailNotification({
    $id: Now.ID['notif_damage_fee'],
    table: 'x_1939459_shorelin_damage_report',
    name: 'Shoreline - Damage Fee Assessed',
    description: 'Notifies the customer when a damage fee is recorded',
    active: true,
    triggerConditions: {
        onRecordInsert: true,
        onRecordUpdate: true,
        condition: 'fee_waived=false^damage_fee>0',
    },
    recipientDetails: {
        recipientFields: ['opened_by'],
    },
    emailContent: {
        contentType: 'text/html',
        subject: 'Damage report \${number} — fee assessed',
        messageHtml: `
<p>A damage fee of <strong>$\${damage_fee}</strong> has been assessed against your rental.</p>
<p><strong>Severity:</strong> \${severity}<br/>
<strong>Notes:</strong> \${incident_notes}</p>
<p>If you believe this fee was assessed in error, reply to this email with
report # \${number}.</p>
<p>— The Shoreline Crew</p>
        `,
    },
})
