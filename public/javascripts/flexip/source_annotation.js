var url = '';
var selection = null;

var ignoreNextLayerActivation = false;
var ignoreNextLayerDeactivation = false;

var config_url = "/image/annotations/ajax/loadConfiguration/";
var annotator = new Annotator();

$(document).ready(function() {
    if(jthc.options.selectedImage) {
        if(jthc.options.selectedFragment) activateImageByFragment(jthc.options.selectedFragment);
        else  activateImage(jthc.options.selectedImage);
    }
    $(".flexip-toggle").click(function(e) {
        var url = $(this).attr("href");
        loadFlexip(url);
        return false;
    });
});

function activateImage(image, fragment) {
    if($('div.section.images').prev().hasClass("closed"))
        $('div.section.images').prev().click();

    if(fragment) selection = fragmentToLayer(fragment).id;

    if(flexip == null || url != image) {
        url = image;
        loadFlexip(image);
    }
    else {
        flexip.sideMenuActivateLayer(selection);
        jumpToAnchor("flexip-area");
    }
}

function activateImageByFragment(fragment, element) {
    var myUrl = '';
    if(jthc && !$.isEmptyObject(jthc.imageFragments)) {
        for(myUrl in jthc.imageFragments)
            for(urlFragment in jthc.imageFragments[myUrl])
                if(urlFragment == fragment) {
                    if(typeof element != "undefined")  {
                        var collapsed = element.hasClass('collapsed');
                        jthc.hideAllNotes();
                        ignoreNextLayerActivation = true;
                        ignoreNextLayerDeactivation = true;
                        if(collapsed) {
                            element.removeClass('collapsed').addClass('expanded');
                            activateImage(myUrl, jthc.imageFragments[myUrl][fragment]);
                        }
                        else {
                            if(flexip) flexip.sideMenuActivateLayer();
                        }
                    }
                    else {
                        activateImage(myUrl, jthc.imageFragments[myUrl][fragment]);
                    }
                    return true;
                }
    }
    return false;
}

/// TODO: remove? Is the same as in common.
function allModulesLoaded() {
    this.flexipRef.imageLoadSource(config.image);
}

function commInterfaceSettingsParseEnd() {
    if(jthc && jthc.imageFragments[url]) {
        fragments = [];
        for(fragment in jthc.imageFragments[url])
            if(coordinates = jthc.imageFragments[url][fragment])
                fragments.push(coordinates);

        annotator.resetLoadedFragments();
        annotator.loadFragments(url, fragments, null, true);
    }
    this.flexipRef.messageBoxHide();
    jumpToAnchor("flexip-area");
}

function layerAdded(layerId) {
    if(selection && selection == layerId) flexip.sideMenuActivateLayer(layerId);
    selection = null;
}

function layerActivated(layerId) {
    if(!ignoreNextLayerActivation) {
        if(jthc) {
            jthc.hideAllNotes();
            var coordinates = annotator.loadedFragments[layerId];
            for(fragment in jthc.imageFragments[url])
                if(jthc.imageFragments[url][fragment] == coordinates)
                    $('div[about="'+fragment+'"]').removeClass("collapsed").addClass("expanded");
        }
    }
    ignoreNextLayerActivation = false;
    ignoreNextLayerDeactivation = false;
}

function layerDeactivated(layerId) {
    flexip.sideMenuSetLayerVisible(layerId, false);
    if(!ignoreNextLayerDeactivation && jthc) jthc.hideAllNotes();
    ignoreNextLayerDeactivation = false;
}