var temp = null;
var config_url = "/admin/image/annotations/ajax/loadConfiguration/";

function toolBarButtonClick(fCode) {
  // New layer
  switch(fCode) {
    case 24:
      newLayerMessageBox();
      break;

    case 26:
      enableForm();
      break;
  }
}

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

function enableForm() {
  layer = flexip.getSelectedLayer();
  if(!layer) return;
  $("#image-annotations-form").append('Meaningful text field: <input type="text" value="'+layer+'"/>');
  $("#image-annotations-form").append('<input type="submit" name="Fake save"/>');
}
