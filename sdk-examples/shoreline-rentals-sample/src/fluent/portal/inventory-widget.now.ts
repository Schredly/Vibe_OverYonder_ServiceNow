import { SPWidget } from '@servicenow/sdk/core'

/**
 * Service Portal widget: splash card showing featured inventory with "Reserve"
 * deep-links into the catalog.
 */
SPWidget({
    $id: Now.ID['widget_shoreline_inventory'],
    name: 'Shoreline Inventory',
    id: 'shoreline-inventory',
    clientScript: Now.include('./inventory-widget.client.js'),
    serverScript: Now.include('./inventory-widget.server.js'),
    htmlTemplate: Now.include('./inventory-widget.html'),
    customCss: Now.include('./inventory-widget.scss'),
    hasPreview: true,
})
