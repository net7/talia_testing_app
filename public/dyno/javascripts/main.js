$(function() {
    var settings = {
        uri: [],
        source: 'http://131.114.79.25:8080/sindice/',
        lang: 'en',
        altQuerystring: false,
        jsonp: true
    };

    if($("#dyno_uris a[href]", window.opener.document)) {
        $("#dyno_uris a[href]", window.opener.document).each(function(i, a) {
            settings.uri.push($(a).attr("href"));
        });

        if($("section#dyno-attributes"))
            $("section#dyno-attributes").dyno(settings);
    }
    return;
});

(function($) {
    $.fn.dyno = function(settings) {
        var row =null;
        var values = {};

        var config = {
            uri: null,
            values: null,
            source: null,
            lang: 'en'
        };

        function drawImage(url, text) {
            var image = '<a href="'+url+'">';
            image += '<img width="50" height="50" src="'+url+'" alt="'+text+'" title="'+text+'"/>';
            image += '</a>';
            return image;
        };

        function drawLink(url, text) {
            return '<a href="'+url+'">'+text+'</a><br/>';
        };

        function drawText(text) {
            return text+'<br/>';
        };

        function addRow(element, name, value) {
            var temp = $(tableRow).clone();
            $(".dyno-name", temp).html(name);
            $(".dyno-value", temp).html(value);
            temp.appendTo(element);
        };

        function draw(values, element) {
            if(!values) return false;
            tableRow = $(".dyno-attribute", element).first().detach();
            if(!tableRow.html()) return false;

            $("#dyno-title", element).text(values['title']);
            for(var i in values.rows) {
                var row = values.rows[i];
                if(typeof row.value == 'string') row.value = [row.value];
                if(typeof row.source == 'string') row.source = [row.source];
                if(row.type == 'image') {
                    var image = '';
                    for(var j = 0; j < row.value.length; j++)
                        image += drawImage(row.value[j].url, row.value[j].text);
                    addRow(element, row.name, image);
                }
                else if(row.type == 'link') {
                    var link = '';
                    for(var j = 0; j < row.value.length; j++)
                        link += drawLink(row.value[j].url, row.value[j].text);
                    addRow(element, row.name, link);
                }
                else {
                    var text = '';
                    for(var j = 0; j < row.value.length; j++)
                        text += drawText(row.value[j].text);
                    addRow(element, row.name, text);
                }
            }
            return true;
        }

        function urlEncode(url) {
            return escape(url).replace(/\+/g,'%2B').replace(/%20/g, '+').replace(/\*/g, '%2A').replace(/\//g, '%2F').replace(/@/g, '%40')
        }

        function altQuerystring(uri) {
            for(i in uri)
                uri[i] = urlEncode(uri[i]);

            return settings.source+"/"+uri.join(',')+"/"+urlEncode(settings.lang);
        }

        if(settings) $.extend(config, settings);

        return this.each(function() {
            if(config.values) return draw(config.values, $(this));

            var uri = config.uri || $(this).attr("rdf:about");
            if(!uri) return false;
            if(typeof uri == 'string') uri = [uri];
           

            var request = (settings.altQuerystring) ? altQuerystring(uri) : settings.source;
            var params  = (settings.altQuerystring) ? {} : {urls: uri.join(','), lang: config.lang};
            var element = $(this);

            $("#loading").show();

            if(settings.jsonp) {
                $.getJSON(request+"?callback=?", params, function(data) {
                    /// TODO: error handling.
                    draw(data, element);
                    $("#loading").hide();
                });
            }
            else {
                $.get(request, params, function(data) {
                    /// TODO: error handling.
                    draw(data, element);
                    $("#loading").hide();
                });
            }
        });
    };
})(jQuery);