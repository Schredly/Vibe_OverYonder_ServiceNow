import { UiAction } from '@servicenow/sdk/core'

/**
 * "Hatch Day" — closes the batch, creates a bird record for each successful
 * chick (sex=unknown), advances status to complete. Farmer can rename/retag
 * the birds later.
 */
UiAction({
    $id: Now.ID['ua_hatch_day'],
    table: 'x_1939459_cluck_incubation',
    actionName: 'hatch_day',
    name: 'Hatch Day — Register Chicks',
    active: true,
    showUpdate: true,
    showInsert: false,
    hint: 'Mark the batch complete and auto-create bird records for each chick that hatched.',
    condition: "current.status != 'complete' && current.chicks_hatched > 0",
    form: { showButton: true, style: 'primary' },
    script: `
        var count = parseInt(current.chicks_hatched, 10) || 0;
        if (count <= 0) {
            gs.addErrorMessage('Set chicks_hatched before running Hatch Day.');
            action.setRedirectURL(current);
            return;
        }
        var today = new GlideDateTime().getDate().getValue();
        var breedId = current.breed + '';
        var flockHint = current.parent_flock + '';
        var batchName = current.batch_name + '';
        for (var i = 1; i <= count; i++) {
            var b = new GlideRecord('x_1939459_cluck_bird');
            b.initialize();
            b.setValue('tag_id', 'CHK-' + current.number + '-' + i);
            b.setValue('name', 'Chick ' + i + ' (' + batchName + ')');
            if (breedId) b.setValue('breed', breedId);
            if (flockHint) b.setValue('flock', flockHint);
            b.setValue('sex', 'unknown');
            b.setValue('hatched_date', today);
            b.setValue('status', 'active');
            b.insert();
        }
        if (current.eggs_set > 0) {
            current.hatch_rate_pct = Math.round((count / current.eggs_set) * 1000) / 10;
        }
        current.status = 'complete';
        current.actual_hatch_date = today;
        current.update();
        gs.addInfoMessage('Created ' + count + ' chick records from batch ' + batchName + '.');
        action.setRedirectURL(current);
    `,
    roles: ['x_1939459_cluck.farmer'],
    order: 100,
})
