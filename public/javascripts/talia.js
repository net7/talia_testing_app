$(document).ready(function() {
    $('h3.toggle').live('click', function() {
		$(this).toggleClass("closed").next("div").toggle();
    });
});