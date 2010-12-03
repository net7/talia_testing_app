(function($) {
    $.fn.dyno = function(settings) {
        var rowPrototype = null;

        /// Sources found during rendering, used to display 
        /// a "limit result to sources" link.
        var sources = null;

        /// Default configuration.
        var config = {
            uris: [],
            values: null,
            source: null,
            lang: 'en',
            timeout: 30000,
            callback: null,
            callback_error: null
        };

        /// Used to check for timeout in bridge requests.
        var timer = null;

        /// Called before querying for values and drawing the table.
        function onLoadStart() {
            $(".dyno-onload-show").hide();
            $(".dyno-onload-hide").show();
            $(".dyno-attribute").hide();
        }
 
        /// Called after the table has been drawn.
        function onLoadEnd() {
            $(".dyno-attribute").show();
            $(".dyno-onload-show").show(); 
            $(".dyno-onload-hide").hide(); 
        }

        /// Added to the names field of the table, 'predicate' is the RDF id of the property,
        /// while _name_ is it's label.
        function drawPredicate(predicate) {
            if(!predicate) return '';
            return ' [<a class="dyno-predicate" alt="'+predicate+'" href="'+predicate+'">?</a>] ';
        }

        /// Added to each value in the table, even when values are grouped by property name.
        /// This is the one value in config.uris this property value is really about.
        function drawSource(source) {
            if(!source) return '';
            return ' [<a class="dyno-source" alt="'+source+'" href="'+source+'">source?</a>] ';
        }

        /// Called is a value is defined as an image, for HTML formatting.
        function drawImage(data, filter) {
            if(filter && data.source != filter) return '';
            var image = '<a target="_blank" href="' + data.url + '">';
            image += '<img width="50" height="50" src="'+data.url+'" alt="'+data.text+'" title="'+data.text+'"/>';
            image += '</a>' + drawSource(data.source);
            return image;
        };

        /// Called is a value is defined as a link, for HTML formatting.
        function drawLink(data, filter) {
            if(filter && data.source != filter) return '';
            return '<a target="_blank" href="'+data.url+'">'+data.text+'</a>' + drawSource(data.source) + '<br/>';
        };

        /// Called is a value is  defined as text (this is the default), for HTML formatting.
        function drawText(data, filter) {
            if(filter && data.source != filter) return '';
            return data.text + drawSource(data.source) + '<br/>';
        };

        /// Clones the template extracted from the HTML, fills it with one row of data, and appends 
        /// the result back to the HTML.
        function addRow(element, name, value, predicate) {
            var temp = $(rowPrototype).clone();
            $(".dyno-name p", temp).html(name+drawPredicate(predicate));
            $(".dyno-value p", temp).html(value);
            temp.appendTo(element);
        };

        /// Draws the table.
        function draw(values, element, source) {
            if(!values) return false;

            if(!rowPrototype) rowPrototype = $(".dyno-attribute", element).first().detach();
            if(!rowPrototype.html()) return false;

            $("#dyno-title h1", element).text(values['title']);
            for(var i in values.rows) {
                var row = values.rows[i];
                if(typeof row.value == 'string') row.value = [row.value];
                if(typeof row.source == 'string') row.source = [row.source];
                if(row.type == 'image') {
                    var image = '';
                    for(var j = 0; j < row.value.length; j++)
                        image += drawImage(row.value[j], source);
                    if(image) addRow(element, row.name, image, row.url);
                }
                else if(row.type == 'link') {
                    var link = '';
                    for(var j = 0; j < row.value.length; j++)
                        link += drawLink(row.value[j], source);
                    if(link) addRow(element, row.name, link, row.url);
                }
                else {
                    var text = '';
                    for(var j = 0; j < row.value.length; j++)
                        text += drawText(row.value[j], source);
                    if(text) addRow(element, row.name, text, row.url);
                }
            }

            /// Now, unless this is not the first time we load, 
            /// look around the table for sources, so we can build 
            /// the sources filter section.
            if(!sources && $("#dyno-sources-list")) {
                sources = [];
                $(".dyno-source").map(function() {
                    if(!sources[$(this).attr("href")]) sources[$(this).attr("href")] = 1;
                });
                $("#dyno-sources-list").append('<a class="dyno-load-source" href="#">All</a> ');
                for(var source in sources) 
                    $("#dyno-sources-list").append(' <a class="dyno-load-source" href="' + source + '">' + source + '</a> ');

                $(".dyno-load-source").live("click", function(e) {
                    $(".dyno-attribute").remove();
                    var source = $(this).attr("href") != '#' ? $(this).attr("href") : null;
                    draw(values, element, source);
                    singleResultSlide();
                    return false;
                });
            }
            onLoadEnd();

            if(config.callback) config.callback();
            return true;
        }

        /// Utility, custom url-encode function. The default JS ones are not exactly what we need.
        function urlEncode(url) {
            return escape(url).replace(/\+/g,'%2B').replace(/%20/g, '+').replace(/\*/g, '%2A').replace(/\//g, '%2F').replace(/@/g, '%40')
        }

        /// Rewrites the querystring for the request to the bridge for the human-readable format: <url>/<param1>/<param2> etc.
        function altQuerystring(uris) {
            for(i in uris)
                uris[i] = urlEncode(uris[i]);

            return config.source+"/"+uris.join(',')+"/"+urlEncode(config.lang);
        }

        function timeout() {
            var message = "Timeout, " + (config.timeout/1000) + " seconds have passed and still no response from the server.";
            error('timeout', message);
            clearTimeout(timer);
        }

        /// Error handling: calls config.callback_error if defined or goes with the default (an alert dialog).
        function error(id, message) {
            if(config.callback_error) config.callback_error(id, message);
            else alert(message);
            onLoadEnd();
            return false;
        }

        /// Some jQuery magic to set configuration from the user and use defaults if needed.
        if(settings) $.extend(config, settings);

        /// The main function of the plugin
        /// This is how you create a jQuery plugin.
        return this.each(function() {
            onLoadStart();
            if(config.values) return draw(config.values, $(this));

            var uris = config.uris && config.uris.length ? config.uris : [$(this).attr("rdf:about")];

            if(!uris || !uris.length) return error('no_uris', 'No uri(s) requested');
            if(typeof uris == 'string') uris = [uris];

            var request = (config.altQuerystring) ? altQuerystring(uris) : config.source;
            var params  = (config.altQuerystring) ? {} : {urls: uris.join(','), lang: config.lang};
            var element = $(this);

            /// jQuery sucks at this, so let's try to setup a simple timeout handler.
            timer = setTimeout(timeout, config.timeout);
            /// TODO: need to add a "connection timeout" error.
            if(config.jsonp) {
                $.getJSON(request+"?callback=?", params, function(data) {
                    clearTimeout(timer);
                    if(data.error) return error('response_error', data.error);
                    draw(data, element);
                });
            }
            else {
                $.get(request, params, function(data) {
                    clearTimeout(timer);
                    if(data.error) return error('response_error', data.error);
                    draw(data, element);
                }, 'json');
            }
        });
    };
})(jQuery);