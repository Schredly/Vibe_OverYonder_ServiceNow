import { UiAction } from '@servicenow/sdk/core'

/**
 * "Record Weight" — quick form button on bird record. Prompts for weight,
 * saves in grams, timestamps note into work_notes.
 */
UiAction({
    $id: Now.ID['ua_record_weight'],
    table: 'x_1939459_cluck_bird',
    actionName: 'record_weight',
    name: 'Record Weight',
    active: true,
    showUpdate: true,
    showInsert: false,
    hint: 'Log a current weight reading for this bird.',
    form: {
        showButton: true,
        showContextMenu: true,
        style: 'primary',
    },
    script: `
        var w = prompt('Weight in grams:');
        if (w) {
            current.weight_grams = parseInt(w, 10);
            current.update();
            gs.addInfoMessage('Weight ' + w + 'g recorded for ' + current.name);
        }
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_cluck.farmhand'],
    order: 100,
})

/**
 * "Mark Deceased" — shorthand for setting bird to deceased; business rule
 * handles flock decrement.
 */
UiAction({
    $id: Now.ID['ua_mark_deceased'],
    table: 'x_1939459_cluck_bird',
    actionName: 'mark_deceased',
    name: 'Mark Deceased',
    active: true,
    showUpdate: true,
    hint: 'Bird has passed away. Updates flock count automatically.',
    condition: "current.status != 'deceased'",
    form: {
        showButton: true,
        showContextMenu: true,
        style: 'destructive',
    },
    script: `
        current.status = 'deceased';
        current.update();
        gs.addInfoMessage(current.name + ' marked deceased. Flock count updated.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_cluck.farmer'],
    order: 200,
})
