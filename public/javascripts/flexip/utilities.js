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

function parse_url_for_pseudo_id(url) {
  if(url && (matches = url.match(/[\/|\\]([^\\\/]+)$/)))
    return matches[1];
}

var SwickyCommunication = function() {
  this.start = function(url) {
    window.status = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<container_uri>'+url+'</container_uri>\
</fragment>\
</annotator_message>';
  }
}

var Annotator = function() {
    $.base64.is_unicode = true;

    /// Used to ignore requests when doing stuff.
    this.busy = false;
    
    this.setBusy = function() {
        this.busy = true;
    }
    
    this.setFree = function() {
        this.busy = false;
    }
    
    this.loadFragments = function (image, fragments, selection) {
        /// Accept calls only if not busy.
        if(this.busy) return false;
        this.setBusy();
        /// If the image is different, or flexip is not loaded yet,
        /// open/change image and go from there.
        if(image != url) alert('TODO');
        if(fragments) for(fragment in fragments) flexip.sideMenuAddChildLayer($.base64.decode(fragment));
        /// If selection is given, activate the relative layer.
        /// TODO: flexip does not support javascript layer selection yet.
        if(selection) {
          layer = $.base64.decode(selection);
          alert('TODO: load selected layer ('+layer.itemID+')');
        }
        flexip.messageBoxHide();
        this.setFree();
    }
/*
annotator.lock([message])
annotator.unlock([message])
annotator.alert(message)*
*/
}
