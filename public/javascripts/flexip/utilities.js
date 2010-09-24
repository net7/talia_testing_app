$.base64.is_unicode = true;

var SwickyCommunication = function() {
    this.start = function(url) {
        window.status = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
</fragment>\
</annotator_message>';
    }

    this.annotate = function(url, layerString) {
        window.status = '\
<annotator_message action="annotation_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+$.base64.encode(layerString)+'</layer>\
</fragment>\
</annotator_message>';

    }

    this.selected = function(url, layerString) {
        window.status = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+$.base64.encode(layerString)+'</layer>\
</fragment>\
</annotator_message>';
    }
}

var Annotator = function() {
    /// Used to ignore requests when doing stuff.
    this.busy = false;
    
    this.setBusy = function() {
        this.busy = true;
    }
    
    this.setFree = function() {
        this.busy = false;
    }
    
    this.loadFragments = function (image, fragments, selection) {
        layers = [];

        for(var i = 0; i < fragments.length; i++)
            layers.push(JSON.parse($.base64.decode(fragments[i])));

        /// Accept calls only if not busy.
        if(this.busy) return false;
        this.setBusy();
        /// If the image is different, or flexip is not loaded yet,
        /// open/change image and go from there.
        if(image != url) {
            url = image;
            loadFlexip(image, layers, selection);
            return;
        }

        if(layers) for(var i = 0; i < layers.length; i++)
            flexip.sideMenuAddChildLayer(layers[i]);
        /// If selection is given, activate the relative layer.
        /// TODO: flexip does not support javascript layer selection yet.
        if(selection) {
            layer = JSON.parse($.base64.decode(selection));
            flexip.sideMenuActivateLayer(layer.itemID)
        }
        flexip.messageBoxHide();
        this.setFree();
    }

    this.selectFragment = function(image, fragment) {
        this.loadFragments(image, null, fragment);
    }

    this.lock = function(message) {
      this.setBusy();
      flexip.MessageBoxShowMessage(message);
    }

    this.unlock = function(message) {
        this.setFree();
        if(message) flexip.messageBoxShowAlert(message);
        else flexip.messageBoxHide();
    }

    this.alert = function(message) {
        flexip.messageBoxShowAlert(message);
    }
}

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

function firefoxBugFix() {
  var img = new Image();
  img.src = '/images/rails.png';
}
