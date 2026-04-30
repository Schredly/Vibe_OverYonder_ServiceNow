import { SPWidget } from '@servicenow/sdk/core'

/**
 * "Today's Basket" — live egg-stock splash ported from Figma Make output.
 * Sticky header, dozens hero, three-tile stats strip, six grade cards
 * (with a sage "Rare find" Novelty variant for double-yolks), CSA CTA band,
 * brown footer. Bound to GlideRecord aggregates over today's egg_log rows.
 */
SPWidget({
    $id: Now.ID['widget_todays_basket'],
    name: 'Today\'s Basket',
    id: 'cluck-todays-basket',
    clientScript: Now.include('./todays-basket-widget.client.js'),
    serverScript: Now.include('./todays-basket-widget.server.js'),
    htmlTemplate: Now.include('./todays-basket-widget.html'),
    customCss: Now.include('./todays-basket-widget.scss'),
    hasPreview: true,
})
