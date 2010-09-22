var config_url = "/admin/image/annotations/ajax/loadConfiguration/";
var pseudo_id = null;

var url = '';
var selection = '';
var swicky = new SwickyCommunication();
var annotator = new Annotator();

$(document).ready(function() {
    $(".flexip-toggle").click(function(e) {
        annotator.setBusy();
        url = $(this).attr("href");
        pseudo_id = parse_url_for_pseudo_id(url);
        loadFlexip(pseudo_id);
        return false;
    });
});

function imageLoaded() {
    firefoxBugFix();
    annotator.setFree();
    swicky.start(url);
}

function dataParseEnd() {}

function toolBarButtonClick(fCode) {
    switch(fCode) {
        /// New layer
    case 24:
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
    swicky.annotate(url, JSON.stringify(layer));
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
    if(title != '') flexip.sideMenuAddChildLayer(newLayerObject(title));
}

function layerClick(layerId) {}
function layerActivated(layerId) {
    flexip.sideMenuGetLayerInfo(layerId, true, 'selectedLayer');
}

function selectedLayer(layerData) {
    swicky.selected(url, JSON.stringify(layerData))
}
