import { SPWidget } from '@servicenow/sdk/core'

/**
 * "Meet the Flock" — adoptable-hens showcase ported from the Figma Make output
 * (warm cream / terracotta / sage palette, Fraunces + Inter typography). Header,
 * hero, filter bar, hen-card grid, footer all in one widget so it renders as
 * a full page at /sp?id=cluck_flock.
 */
SPWidget({
    $id: Now.ID['widget_meet_flock'],
    name: 'Meet the Flock',
    id: 'cluck-meet-flock',
    clientScript: Now.include('./meet-the-flock-widget.client.js'),
    serverScript: Now.include('./meet-the-flock-widget.server.js'),
    htmlTemplate: Now.include('./meet-the-flock-widget.html'),
    customCss: Now.include('./meet-the-flock-widget.scss'),
    hasPreview: true,
})
