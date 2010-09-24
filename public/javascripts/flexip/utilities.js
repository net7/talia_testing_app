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

    this.annotate = function(url, layerId) {
        window.status = '\
<annotator_message action="annotation_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+annotator.loadedFragment(layerId)+'</layer>\
</fragment>\
</annotator_message>';
    }

    this.selected = function(url, layerId) {
        window.status = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+annotator.loadedFragment(layerId)+'</layer>\
</fragment>\
</annotator_message>';
    }
}

var Annotator = function() {
    this.loadedFragments = [];

    /// Used to ignore requests when doing stuff.
    this.busy = false;
    
    this.setBusy = function() {
        this.busy = true;
    }
    
    this.setFree = function() {
        this.busy = false;
    }
    
    this.loadFragments = function (image, fragments, selectedFragment) {
        var layers = [];
        this.loadedFragments = [];
        /// Accept calls only if not busy.
        if(this.busy) return false;
        this.setBusy();

        if(fragments) for(var i = 0; i < fragments.length; i++) {
            layer = JSON.parse($.base64.decode(fragments[i]));
            layer.itemID = layer.id;
            layer.parentLayerID = "#root#";
            if(!this.loadedFragment(layer.id)) {
                layers.push(layer);
                this.fragmentLoaded(layer.id, fragments[i]);
            }
        }

        /// This is a global variable.
        if(selectedFragment)
            selection = JSON.parse($.base64.decode(selectedFragment)).id;

        /// If the image is different, or flexip is not loaded yet,
        /// open/change image and go from there.
        if(image != url) {
            if($('div.section.images').prev().hasClass("closed"))
                $('div.section.images').prev().click();
            url = image;
            loadFlexip(image, layers);
            return;
        }

        if(layers) for(var i = 0; i < layers.length; i++)
            flexip.sideMenuAddChildLayer(layers[i]);

        flexip.messageBoxHide();
        this.setFree();
    }

    this.selectFragment = function(image, fragment) {
        this.loadFragments(image, null, fragment);
    }

    this.lock = function(message) {
        if(!flexip) return false;
        this.setBusy();
        flexip.MessageBoxShowMessage(message);
    }

    this.unlock = function(message) {
        if(!flexip) return false;
        this.setFree();
        if(message) flexip.messageBoxShowAlert(message);
        else flexip.messageBoxHide();
    }

    this.alert = function(message) {
        if(!flexip) return false;
        flexip.messageBoxShowAlert(message);
    }

    this.fragmentLoaded = function(id, coordinates) {
        this.loadedFragments[id] = coordinates;
    }

    this.loadedFragment = function(id) {
        return this.loadedFragments[id]
    }
}

function newLayerObject(title) {
    var itemId = (new Date()).getTime();
    return {itemID: itemId, id: itemId, parentLayerID: "#root#", visible: "true", opened: "true", layerType: "shapesContainer", title: title};
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
