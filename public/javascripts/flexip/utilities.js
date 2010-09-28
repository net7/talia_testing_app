var ignoreActivationEvent = false;
$.base64.is_unicode = true;

var SwickyCommunication = function() {
    this.start = function(url) {
        var message = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
</fragment>\
</annotator_message>';
        window.status = message;
    }

    this.annotate = function(url, fragment) {
        var message = '\
<annotator_message action="annotation_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+fragment+'</layer>\
</fragment>\
</annotator_message>';
        window.status = message;
    }

    this.selected = function(url, layerId) {
        var fragment = annotator.loadedFragment(layerId);
        if(!ignoreActivationEvent && fragment) {
            var message = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
<layer>'+fragment+'</layer>\
</fragment>\
</annotator_message>';
            window.status = message;
        }
        ignoreActivationEvent = false;
    }

    this.unselected = function(url) {
            var message = '\
<annotator_message action="selection_request">\
<fragment>\
<type>image</type>\
<context_url>'+window.location+'</context_url>\
<container_uri>'+url+'</container_uri>\
</fragment>\
</annotator_message>';
        window.status = message;
    }
}

var Annotator = function() {
    this.loadedFragments = [];
    this.fragmentsByLayerId = {};

    /// Used to ignore requests when doing stuff.
    this.busy = false;
    
    this.setBusy = function() {
        this.busy = true;
    }
    
    this.setFree = function() {
        this.busy = false;
    }
    
    this.loadFragments = function (image, fragments, selectedFragment, invisible) {
        var layers = [];
        /// Accept calls only if not busy.
        if(this.busy) return false;
        this.setBusy();

        if(image != url) annotator.resetLoadedFragments();
        if(fragments) for(var i = 0; i < fragments.length; i++) {
            layer = fragmentToLayer(fragments[i]);
            if(!this.loadedFragment(layer.id)) {
                layers.push(layer);
                this.fragmentLoaded(layer.id, fragments[i]);
            }
        }

        /// This is a global variable.
        if(selectedFragment) {
            selection = fragmentToLayer(selectedFragment).id;
            ignoreActivationEvent = true;
        }

        /// If the image is different, or flexip is not loaded yet,
        /// open/change image and go from there.
        if(image != url) {
            if($('div.section.images').prev().hasClass("closed"))
                $('div.section.images').prev().click();
            url = image;
            loadFlexip(image, layers);
            return;
        }

        if(layers) for(var i = 0; i < layers.length; i++) addLayerJS(layers[i], invisible);

        flexip.messageBoxHide();
        this.setFree();
    }

    this.selectFragment = function(image, fragment) {
        this.loadFragments(image, null, fragment);
    }

    this.lock = function(message) {
        if(!flexip) return false;
        this.setBusy();
        flexip.MessageBoxShow(message);
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
        return this.loadedFragments[id];
    }

    this.resetLoadedFragments = function() {
        this.loadedFragments = [];
    }
}

function fragmentToLayer(fragment) {
    return JSON.parse($.base64.decode(fragment));
}

function layerToFragment(layer) {
    return $.base64.encode(JSON.stringify(layer));
}


function newLayerObject(title) {
    var itemId = (new Date()).getTime();
    return {id: itemId, visible: "true", opened: "true", layerType: "shapesContainer", title: title};
}

function addLayerJS(layer , invisible) {
    layer.itemID = layer.id;
    layer.parentLayerID = "#root#";
    if(invisible && invisible == false) layer.visible = true;
    flexip.sideMenuAddChildLayer(layer);
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

function jumpToAnchor(anchor) {
    if(anchor) {
        var temp = window.location.toString();
        if(temp.indexOf('#') != -1) {
            temp = temp.substring(0, temp.indexOf('#'));
        }
        window.location = temp+"#"+anchor
    }
}