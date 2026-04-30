import { EmailNotification } from '@servicenow/sdk/core'

export const predatorAlertNotification = EmailNotification({
    $id: Now.ID['notif_predator'],
    table: 'x_1939459_cluck_incident',
    name: 'Cluck - Predator Incident Alert',
    description: 'Urgent alert to the farmer role on any new predator incident',
    active: true,
    triggerConditions: {
        onRecordInsert: true,
        onRecordUpdate: false,
        condition: 'incident_type=predator',
    },
    recipientDetails: {
        recipientFields: ['sys_created_by'],
        sendToCreator: true,
    },
    emailContent: {
        contentType: 'text/html',
        subject: '[URGENT] Predator incident reported — \${number}',
        messageHtml: `
<h2 style="color:#c0392b;">Predator Incident</h2>
<ul>
    <li><strong>Incident:</strong> \${number}</li>
    <li><strong>Predator:</strong> \${predator_species}</li>
    <li><strong>Severity:</strong> \${severity}</li>
    <li><strong>Flock:</strong> \${affected_flock}</li>
    <li><strong>Coop:</strong> \${affected_coop}</li>
    <li><strong>Birds lost:</strong> \${birds_lost}</li>
</ul>
<p><strong>Notes:</strong><br/>\${evidence_notes}</p>
<p>Check the coop, the flock, the fencing. Make a plan.</p>
        `,
    },
})
