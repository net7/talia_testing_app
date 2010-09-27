var config_url = "/admin/image/annotations/ajax/loadConfiguration/";
var pseudo_id = null;

var url = '';
var selection = null;

var swicky = new SwickyCommunication();
var annotator = new Annotator();

$(document).ready(function() {
    $(".flexip-toggle").click(function(e) {
        annotator.setBusy();
        url = $(this).attr("href");
        loadFlexip(url);
        return false;
    });
});

function commInterfaceSettingsParseEnd() {
    var layers = flexip.layers;
    /// This appens if swicky has requested an image not shown and Flexip was (re)loaded.
    if(layers && layers.length > 0) {
        for(var i = 0; i < layers.length; i++) addLayerJS(layers[i]);
        flexip.messageBoxHide();
    }
    else annotator.resetLoadedFragments();

    firefoxBugFix();
    annotator.setFree();
    swicky.start(url);
}

function layerAdded(layerId) {
    if(selection && selection == layerId)
        flexip.sideMenuActivateLayer(layerId);
}

function dataParseEnd() {}

function toolBarButtonClick(fCode) {
    switch(fCode) {
        /// New layer
    case 999:
        newLayerMessageBox();
        break;
        /// Annotate (Save)
    case 26:
        if(layer = flexip.getSelectedLayer()) {
            annotator.setBusy();
            flexip.sideMenuGetLayerInfo(layer, true, 'annotateLayer');
        }
        break;
    }
}

function annotateLayer(layer) {
    flexip.messageBoxShowMessage('Please wait...');
    fragment = annotator.loadedFragment(layer.id, fragment);
    if(!fragment) {
        var fragment = layerToFragment(layer);
        annotator.fragmentLoaded(layer.id, fragment);
    }
    swicky.annotate(url, fragment);
}

function newLayerMessageBox() {
    var messageBox = {
        text_array: [
            {label: 'New layer', label_is_title:true},
            {input: '', input_title: 'Layer name'},
        ],
        btn_array: [
            {btn_label: 'Create', btn_callback: 'newLayer'},
            {btn_label: 'Cancel'}
        ] 
    }
    flexip.messageBoxShow(messageBox);
}

function newLayer(layerData) {
    var title = $.trim(layerData.return_inputs[0]);
    if(title != '') {
        layer = newLayerObject(title);
        addLayerJS(layer);
    }
}

function layerClick(layerId) {}
function layerActivated(layerId) {
    flexip.sideMenuGetLayerInfo(layerId, true, 'selectedLayer');
}

function selectedLayer(layer) {
    swicky.selected(url, layer.id)
}
