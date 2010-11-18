$(function() {
    var settings = {
        uri: [],
        source: 'http://131.114.79.25:8080/sindice/',
        lang: 'en',
        altQuerystring: false,
        jsonp: true,
        callback: function() {
            $(".dyno-predicate").tooltip({
                delay: 0,
                showURL: false,
                bodyHandler: function() { 
                    return '<h3>Predicate URI: ' + this + '</h3>';
                }
            });
            $(".dyno-source").tooltip({
                delay: 0,
                showURL: false,
                bodyHandler: function() { 
                    return '<h3>Source: ' + this + '<h3>';
                }
            });
        }
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
});