var url = '';
var selection = null;

var config_url = "/image/annotations/ajax/loadConfiguration/";
var annotator = new Annotator();

$(document).ready(function() {
    if(jthc.options.selectedImage) {
        if(jthc.options.selectedFragment) activateImageByFragment(jthc.options.selectedFragment);
        else  activateImage(jthc.options.selectedImage);
    }
    $(".flexip-toggle").click(function(e) {
        url = $(this).attr("href");
        loadFlexip(url);
        return false;
    });
});

function activateImage(image, fragment) {
    if($('div.section.images').prev().hasClass("closed"))
        $('div.section.images').prev().click();

    if(fragment) selection = fragmentToLayer(fragment).id;

    if(flexip == null || url != image) {
        url = image
        loadFlexip(image);
    }
    else {
        flexip.sideMenuActivateLayer(selection)
        jumpToAnchor("flexip-area");
    }
}

function activateImageByFragment(fragment, hideNote) {
    if(jthc && !$.isEmptyObject(jthc.imageFragments)) {
        for(url in jthc.imageFragments)
            for(urlFragment in jthc.imageFragments[url])
                if(urlFragment == fragment) {
                    
                    if(hideNote) self.hideNote(fragment);
                    else jthc.showNote(fragment);

                    activateImage(url, jthc.imageFragments[url][fragment]);
                    return true;
                }
    }
    return false;
}



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
        annotator.loadFragments(url, fragments);
    }
    this.flexipRef.messageBoxHide();
    jumpToAnchor("flexip-area");
}

function layerAdded(layerId) {
    if(selection && selection == layerId) flexip.sideMenuActivateLayer(layerId);
    selection = null;
}

function layerActivated(layerId) {
    coordinates = annotator.loadedFragment(layerId);
    for(fragment in jthc.imageFragments[url]) {
        jthc.showNote(fragment);
    }
}