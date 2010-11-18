$(function() {
    var dyno_uris = [];
    var dyno_sameAs = null;
    if(dyno_sameAs = $(".predicate:contains('owl:sameAs')", "#properties_table")) {
        var dyno_sameAsUris = $("span.value", dyno_sameAs.closest('td').next());
        /// Confirm there is at least one sameAs link.
        if(dyno_sameAsUris && $("a[href]", dyno_sameAsUris).length) {
            /// Make the predicate span containing the "owl:sameAs" text
            /// into a link which opens the dyno popup.
            // dyno_sameAs.html('<a href="#" id="dyno_popup">'+dyno_sameAs.text()+'</a>');

            dyno_sameAsUris.append('<div class="pagination"><a id="dyno-popup" href="#" class="current">Get more data from LOD</a></span>');

            dyno_sameAsUris.attr("id", "dyno-uris");

            $("#dyno-popup").live('click', function() {
                dyno_window = window.open('/dyno/', 'dyno_window', 
                                          "width=840,height=820,scrollbars=no,toolbar=no,location=no,status=no,directories=no,menubar=no");

                dyno_window.focus();
                return false;
            });
        }
    }
});