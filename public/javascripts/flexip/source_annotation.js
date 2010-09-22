var url = '';
var config_url = "/image/annotations/ajax/loadConfiguration/";

$(document).ready(function() {
  $(".flexip-toggle").click(function(e) {
    url = $(this).attr("href");
    pseudo_id = parse_url_for_pseudo_id(url);
    loadFlexip();
    return false;
  });
});