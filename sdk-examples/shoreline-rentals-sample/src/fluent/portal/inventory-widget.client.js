function InventoryWidgetCtrl($scope) {
    var c = this
    c.reserve = function (item) {
        // Deep-link to the single-rental catalog item with equipment preselected.
        window.location.href =
            '/sp?id=sc_cat_item&sys_id=cat_item_single_rental&equipment=' +
            item.sys_id
    }
}
