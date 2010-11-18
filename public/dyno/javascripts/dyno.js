(function($) {
    $.fn.dyno = function(settings) {
        var rowPrototype = null;

        /// Sources found during rendering, used to display 
        /// a "limit result to sources" link.
        var sources = null;

        var config = {
            values: null,
            lang: 'en',
            uri: null,
            source: null,
            jsonp: false,
            callback: null
        };

        function showLoading() {
            $(".dyno-onload-show").hide();
            $("#dyno-loading").show();
            $(".dyno-attribute").hide();
        }

        function hideLoading() {
            $(".dyno-attribute").show();
            $(".dyno-onload-show").show(); 
            $("#dyno-loading").hide();
        }

        function drawPredicate(predicate) {
            if(!predicate) return '';
            return ' [<a class="dyno-predicate" alt="'+predicate+'" title="'+predicate+'" href="'+predicate+'">?</a>] ';
        }

        function drawSource(source) {
            if(!source) return '';
            return ' [<a class="dyno-source" alt="'+source+'" title="'+source+'" href="'+source+'">?</a>] ';
        }

        function drawImage(data, filter) {
            if(filter && data.source != filter) return '';
            var image = '<a target="_blank" href="' + data.url + '">';
            image += '<img width="50" height="50" src="'+data.url+'" alt="'+data.text+'" title="'+data.text+'"/>';
            image += '</a>' + drawSource(data.source);
            return image;
        };

        function drawLink(data, filter) {
            if(filter && data.source != filter) return '';
            return '<a target="_blank" href="'+data.url+'">'+data.text+'</a>' + drawSource(data.source) + '<br/>';
        };

        function drawText(data, filter) {
            if(filter && data.source != filter) return '';
            return data.text + drawSource(data.source) + '<br/>';
        };

        function addRow(element, name, value, predicate) {
            var temp = $(rowPrototype).clone();
            $(".dyno-name", temp).html(name+drawPredicate(predicate));
            $(".dyno-value", temp).html(value);
            temp.appendTo(element);
        };

        function draw(values, element, source) {
            if(!values) return false;

            if(!rowPrototype) rowPrototype = $(".dyno-attribute", element).first().detach();
            if(!rowPrototype.html()) return false;

            $("#dyno-title", element).text(values['title']);
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
                    return false;
                });
            }
            hideLoading();
            if(config.callback) config.callback();

            return true;
        }

        function urlEncode(url) {
            return escape(url).replace(/\+/g,'%2B').replace(/%20/g, '+').replace(/\*/g, '%2A').replace(/\//g, '%2F').replace(/@/g, '%40')
        }

        function altQuerystring(uri) {
            for(i in uri)
                uri[i] = urlEncode(uri[i]);

            return config.source+"/"+uri.join(',')+"/"+urlEncode(config.lang);
        }

        if(settings) $.extend(config, settings);

        return this.each(function() {
            showLoading();
            if(config.values) return draw(config.values, $(this));
            var uri = config.uri || $(this).attr("rdf:about");
            if(!uri) return false;
            if(typeof uri == 'string') uri = [uri];
            
            var request = (config.altQuerystring) ? altQuerystring(uri) : config.source;
            var params  = (config.altQuerystring) ? {} : {urls: uri.join(','), lang: config.lang};
            var element = $(this);
            
            if(config.jsonp) {
                $.getJSON(request+"?callback=?", params, function(data) {
                    /// TODO: error handling.
                    draw(data, element);
                });
            }
            else {
                $.get(request, params, function(data) {
                    /// TODO: error handling.
                    draw(data, element);
                });
            }
        });
    };
})(jQuery);