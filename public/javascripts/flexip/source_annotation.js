var url = '';
var selection = null;

var config_url = "/image/annotations/ajax/loadConfiguration/";
var annotator = new Annotator();

$(document).ready(function() {
    $(".flexip-toggle").click(function(e) {
        url = $(this).attr("href");
        loadFlexip(url);
        return false;
    });
});

function commInterfaceSettingsParseEnd() {
    if(jthc && jthc.imageFragments[url]) {
        fragments = [];
        for(fragment in jthc.imageFragments[url])
            if(coordinates = jthc.imageFragments[url][fragment]["http://discovery-project.eu/ontologies/philoSpace/hasCoordinates"])
                fragments.push(coordinates);
        annotator.loadFragments(url, fragments);
    }
    this.flexipRef.messageBoxHide();
}

function layerAdded(layerId) {
    if(selection && selection == layerId) flexip.sideMenuActivateLayer(layerId);
}

function activateImage(image, fragment) {
    url = image
    selection = fragmentToLayer(fragment).id;
    if($('div.section.images').prev().hasClass("closed"))
        $('div.section.images').prev().click();

    loadFlexip(image);
}