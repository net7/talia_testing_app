// Used to keep previously opened sections, open: will contain the html()
// value of the opened A elements
var openMenuElements = {};

// On doc.ready menu initialization
$(document).ready(function() {
   
	// Initialize the openMenuElements... all closed
	$('a.menu.collapsed,a.menu.expanded').each(function() {
		openMenuElements[$(this).html()] = false;
	}).next().hide();

	// Gets the first menu, giving an empty context => all contexts
	getMenu("");

});

// Asks, through ajax, for the whole menu, given some context
function getMenu(givenContexts) {

    var len = 0;

    if (typeof(myPrefs) != "undefined") {
	    if (myPrefs.get('animations'))
	        len = myPrefs.get('animationsLength');
    } 

	$('div#menu_container').fadeTo(len, "0.3");

	// TODO : idea, si potrebbe aggiungere una classe al menu_container e 
	// intercettare tutti i click alla div mentre ha quella classe .. e ritornare
	// falso! 

	$.ajax({type: "get",
			url: ajaxApiUrl, 
			data: {contexts: givenContexts, lang: myLang, method: "getMenu"},
			success: 
				function(data) {
					
					var h = {};
					// h will be modified here, roughly h = eval(data)
					if (checkJson(data, h) == false)
						return;
					
					// Put the menu into it's own place
					$('div#menu_container').hide();
					$('div#menu_container').html(h.html);

					// "initialize" the menu, hiding the collapsed elements
					$('a.menu.collapsed,a.menu.expanded').each(function(e) {
							if (openMenuElements[$(this).html()] != true) 
								$(this).next().hide();
							else
								$(this).removeClass('collapsed').addClass('expanded');
					});

					$('div#menu_container').show().fadeTo(len, "1.0");
					
				} // success: function(data)

			});

}; // getMenu()

// Menu's expand/collapse menu items
$('a.menu.collapsed,a.menu.expanded').live("click", function() {

    var len = 0;
	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');

    if ($(this).hasClass('collapsed')) {
		openMenuElements[$(this).html()] = true;
        $(this).removeClass('collapsed').addClass('expanded').next().show(len);
    } else {
		openMenuElements[$(this).html()] = false;
        $(this).removeClass('expanded').addClass('collapsed').next().hide(len);
    }
       
    return false;
});


// Update menu click
$('div#menu_container a#menu_update').live("click", function() {
	var c = getSelectedContexts();
	if (c != "") getMenu(c);
	return false;
});



// Menu's collapse/expand
var menuExpWidth = 216,
    menuColWidth = 50;
    
// DEBUG: since it's hard to time a boxview resize() event (due to lag the
// #menu_container and #pageContent animations could not be over yet), there's
// no animations, just a resize()
$('div#menu_container h3:first').live("dblclick", function() {
    $('div#menu_container').addClass("collapsed").width(menuColWidth);
    $('div#pageContent').css({left: menuColWidth+1});
    myBoxView.resize();
});

$('div#menu_container.collapsed').live("dblclick", function() {
    $('div#menu_container').removeClass("collapsed").width(menuExpWidth);
    $('div#pageContent').css({left: menuExpWidth+1});
    myBoxView.resize();
});