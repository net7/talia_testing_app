var url = '';
var config_url = "/image/annotations/ajax/loadConfiguration/";
var annotator = new Annotator();
$(document).ready(function() {
    $(".flexip-toggle").click(function(e) {
        url = $(this).attr("href");
        loadFlexip(url);
        return false;
    });
});

function imageLoaded() {
    fragments = [];
    if(jthc && jthc.imageFragments[url]) {
        for(fragment in jthc.imageFragments[url])
            if(coordinates = jthc.imageFragments[url][fragment]["http://discovery-project.eu/ontologies/philoSpace/hasCoordinates"])
                fragments.push(coordinates);
        annotator.loadFragments(url, fragments, null);
    }
}