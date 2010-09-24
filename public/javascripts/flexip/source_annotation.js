var url = '';
var config_url = "/image/annotations/ajax/loadConfiguration/";

$(document).ready(function() {
    $(".flexip-toggle").click(function(e) {
        url = $(this).attr("href");
        layers = [];
        selection = null;

        if(jthc && jthc.imageFragments[url])
            for(fragment in jthc.imageFragments[url]) 
                layers.push(JSON.parse($.base64.decode(fragment)));

        loadFlexip(url, layers, selection);
        return false;
    });
});