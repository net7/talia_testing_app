$(function() {
    var settings = {
        uri: [],
        source: 'http://131.114.79.25:8080/sindice/',
        lang: 'en',
        altQuerystring: false,
        jsonp: true
    };


    if($("#dyno-uris a[href]", window.opener.document)) {
        $("#dyno-uris a[href]", window.opener.document).each(function(i, a) {
            if(!$(a).attr("id")) settings.uri.push($(a).attr("href"));
        });

        if(settings.uri.length && $("section#dyno-attributes")) {
            $("section#dyno-attributes").dyno(settings);
            $(".dyno-predicate").live("click", function(e) {return false});
            $(".dyno-source").live("click", function(e) {return false});
        }
    }
    return;
});