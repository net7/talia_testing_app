$(document).ready(function() {
	setUpH3Togglers();
});

function setUpH3Togglers()
{
	$('h3.toggle').each(function(index) {
    	$(this).click(function() {
		  $(this).toggleClass("closed").next("div").toggle();
		});
  	});
}