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

function layerButtonClick(layerID,fCode, data) {}

function toolBarButtonClick(fCode) {
  // New layer
  switch(fCode) {
    case 24:
      newLayerMessageBox();
      break;

    case 26:
      /// TODO: need layer's javascript object from flexip.
      break;
  }
}

function layerButtonClick(layerID,fCode, data) {
  /// TODO: need a "layer selected" event from flexip.
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

/*
function layerButtonClick(layerID,fCode, data) {
  // Remove layer
  switch(fCode) {
    case 2:
      temp = layerID;
      confirmMessageBox('Confirm layer deletion?', 'Confirm layer deletion?', 'removeLayerCallback');
      break;
  }
}

function removeLayerCallback(confirm) {
  if(temp && confirm.return_button_label == 'Yes')
    myFjsApi.flexipRef.sideMenuRemoveChildLayer(temp);

  temp = null;
}

function enableForm() {
  layer = flexip.getSelectedLayer();
  if(!layer) return;
  $("#image-annotations-form").append('Meaningful text field: <input type="text" value="'+layer+'"/>');
  $("#image-annotations-form").append('<input type="submit" name="Fake save"/>');
}
*/