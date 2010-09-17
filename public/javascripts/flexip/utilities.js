function newLayerObject(title) {
  var itemId = (new Date()).getTime();
  return {itemID: itemId, visible: "true", opened: "true", layerType: "shapesContainer", title: title};
}

function confirmMessageBox(title, text, callback) {
  flexip.messageBoxShow({
    text_array: [{label: title, label_is_title:true},{label: text}],
    btn_array: [
      {btn_label: 'Yes', btn_callback: callback },
      {btn_label: 'No', btn_callback: callback }]
  });
}
