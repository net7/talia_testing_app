// Various objects: boxview, eztip, prefs, anchorman
var myBoxView = null,
    myEztip = null,
    myPrefs = null,
    myAnchorMan = null,
    // Default language
    myLang = "it",
    // Ajax get/post method, url to get data from
    ajaxMethod = "get",
    ajaxApiUrl = "/boxView/dispatch",
    // List of boxes we are currently loading
    boxesBeingLoaded = {};


$(document).ready(function() {
    // Used to decide wether or not load the intro box
    var isEmpty = true;
    
    // Resize pageContent and menuContainer heights to fill the page, even on window resize
    $('#pageContent,#menu_container').height(($(window).height() - $('#pageHeader').height() - 1));
    $(window).resize(function(){
        $('#pageContent,#menu_container').height(($(window).height() - $('#pageHeader').height() - 1));
    });

    // Initialize the boxView
    myBoxView = new $.boxView($('#pageContent'), 
        {"boxMargin": 1, 
        "collapsedWidth": 30,
        "animateAdd" : false,
        "animateRemove": false,
        "animateCollapse": false,
        "animateResize": false,
        "animationLength": 400, 
        "debug": false,
        "encodeResId": false,
        "onRemove": function() { updateUndoButton(); myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); },
        "onSort": function() { myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); },
        "onAdd": function() { myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); },
        "onCollapse": function() { myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); },
        "onExpand": function() { myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); },
        "onReplace": function() { myAnchorMan.set_section("bv", myBoxView.getAnchorManDesc()); } 
    });

    // Config for tooltips and preferences
    myEztip = new $.eztip({ selector: 'a'});
    myPrefs = new $.doniPrefs({ boxView: myBoxView, eztip: myEztip });

	myAnchorMan = new $.anchorMan({"debug": false, "checkBackButtonTimerMS": 250, "useCookie": false});
	myAnchorMan.add_callbacks("bv", {	
	    "onAdd": 
			function(myId, myResId, ty, co, qstring) {
			    isEmpty = false;
                _loadResource("", qstring, myId, co);
			},
		"onRemove":
			function(id, resId, ty, co, qstring) {
				myBoxView.removeBox(id);
				myBoxView.resize();
			},
		"onChange": 
			function(oldVal, newVal) {
				// Changed only the third value: collapsed flag
				if (oldVal[3] == 1 && newVal[3] == 0 || oldVal[3] == 0 && newVal[3] == 1) {
					myBoxView.toggleCollapseBox(newVal[0]);
				    myBoxView.resize();
			    }
			},
		"onSort":
			function(arr) {
				foo = [];
				for (var i=0; i<arr.length; i++)
					foo[i] = arr[i][0];
				myBoxView.sortLike(foo);
				myBoxView.resize();
			}
	
	});

	myAnchorMan.call_init_callbacks();
	
    // Load the introduction box right away, if there's no other loaded boxes
    if (isEmpty) _loadResource($('#introButton'));
    updateUndoButton();

}); // doc.ready()


// Undo !
$('a#undoButton').live("click", function() {
	myBoxView.undo();
	updateUndoButton();
});

// .resource links management, all around the boxes
$('a.resource').live("click", function() {
	return _loadResource($(this));
});

// Static_resource: will load 'static' contents through webapi (intro, help, edition)
$('a.static_resource').live("click", function() {
	return _loadResource($(this));
});

$('a.quotation_link').live("click", function() {
	if (!$(this).parent().hasClass('selected'))
		return false;
	return _loadResource($(this));
});

function _loadResource(link, givenHref, givenId, givenCollapsed) {

    // console.log("LOAD RESOURCE "+link+" - ", givenHref);

    var href = (typeof(givenHref) == 'undefined') ? link.attr('href') : givenHref,
        data_values = getParametersFromUrl(href),
        resource = data_values['resource'],
        context = data_values['contexts'],
        info = getBoxInfoFromMethod(data_values['method']);

    if (data_values['method'] == "getIndex")
        return _loadIndex(link, givenHref);
    
    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 
            
            var h = {};
            if (checkJson(data, h) == false)
                return false;

            // console.log("AddBOX with "+h);

            if (typeof givenId != "undefined")
                myBoxView.addBox(h['html'], {id: givenId, collapsed: givenCollapsed, qstring: href, resId: "b_"+$.base64Decode(resource), type: info.boxType, title: h.data.box, verticalTitle: info.vertPrefix+' '+h.data.box});
            else
                myBoxView.addBox(h['html'], {qstring: href, resId: "b_"+$.base64Decode(resource), type: info.boxType, title: h.data.box, verticalTitle: info.vertPrefix+' '+h.data.box});
                
            return false;
        }
    });

    return false;
	
} // _loadResource()


// Menu items: will call a getIndex or getIndexByFeature
$('div#menu_container a.indexLink').live("click", function() {
	return _loadIndex($(this));

   /*
    var href = $(this).attr('href'),
        data_values = getParametersFromUrl(href),
        type = data_values['type'],
        feature = data_values['feature'],
        method = data_values['method'],
        contexts = data_values['contexts'],
        uniqueName = method+type+feature;
    
    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 

            var h = {};
            if (checkJson(data, h) == false)
                return false;

            myBoxView.addBox(h['html'], {qstring: href, resId: "index_" + uniqueName + "_" + contexts, type: 'index', title: h.data.box, verticalTitle: h.data.box});
            return false;
        }
    });
    
    return false;
    */
});

function _loadIndex(link, givenHref) {

    // console.log("LOAD INDEX "+link+" - ", givenHref);

    var href = (typeof(givenHref) == 'undefined') ? link.attr('href') : givenHref,
        data_values = getParametersFromUrl(href),
        type = data_values['type'],
        feature = data_values['feature'],
        method = data_values['method'],
        contexts = data_values['contexts'],
        uniqueName = method+type+feature;
    
    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 

            var h = {};
            if (checkJson(data, h) == false)
                return false;

            myBoxView.addBox(h['html'], {qstring: href, resId: "index_" + uniqueName + "_" + contexts, type: 'index', title: h.data.box, verticalTitle: h.data.box});
            return false;
        }
    });
    
    return false;
}



// Widget Collapse button
$("div.box div.widgetHeaderTools p.collapse a").live("click", function() {

    var t = $(this),
        h = t.parents('div.widgetHeader').next(),
        len = 0;
        
	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');

    if (t.hasClass("expanded")) {
        t.addClass("collapsed").removeClass("expanded");
        if (len == 0) 
            h.addClass("collapsed").removeClass("expanded");
        else 
            h.removeClass("expanded").hide(len).addClass("collapsed");

    } else {
        t.addClass("expanded").removeClass("collapsed");
        if (len == 0) 
            h.addClass("expanded").removeClass("collapsed").show();
        else 
            h.hide().removeClass("collapsed").addClass("expanded").show(len);
    }
    
    return false;
});


// Widget's field collapse/expand button
$("div.box span.field_title").live("click", function() { 

    var t = $(this), 
        n = t.next(), 
        len = 0;

	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');

    if (t.hasClass("expanded")) {
        t.addClass("collapsed").removeClass("expanded");
        if (len == 0)
            n.addClass("collapsed").removeClass("expanded").hide();
        else
            n.hide(len).removeClass("expanded").addClass("collapsed");

    } else {

        t.addClass("expanded").removeClass("collapsed");
        if (len == 0)
            n.addClass("expanded").removeClass("collapsed").show();
        else
            n.hide().removeClass("collapsed").addClass("expanded").show(len);

    }

    return false;
});


// Shows and hides the 'fenomeni' window inside the widgets
$("div.box p.fenomeni a").live("click", function() {

    var box_id = $(this).parents('div.box').attr('id'),
        fenBox = $("div.box#"+box_id+" div.fenomeni"),
        len = 0;

	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');

    if (!fenBox.hasClass('hidden')) {
        fenBox.fadeOut(len);
        fenBox.addClass('hidden');
        return false;
    }

    // Positions the 'fenomeni' window under the widget button
    var newLeft = $(this).offset().left - $(this).parent().parent().offset().left - fenBox.width() + $(this).parent().width(),
        newTop = $(this).offset().top - $(this).parent().parent().offset().top + $(this).parent().height();

    fenBox.css({position: 'absolute', left: newLeft, top: newTop});
    fenBox.removeClass('hidden').hide().fadeIn(len);

    // Hides the 'fenomeni' window if the pointer doesnt go inside it in the next 3 secs
    // otherwise it stays alive until the mouse goes out
    var fenTimer = setTimeout(function() { fenBox.fadeOut(len).addClass('hidden'); }, 3000)
    fenBox.hover(function() { clearTimeout(fenTimer); }, function() { fenBox.fadeOut(len).addClass('hidden'); })
    
    return false;
});


// Click on a feature inside the 'fenomeni' window
$("div.box div.fenomeni a.highlight").live("click", function() {
    
    var v = getParametersFromUrl($(this).attr('href')),
        hi = v['highlight'],
        box_id = $(this).parents('div.box').attr('id'),
        fenBox = $("div.box#"+box_id+" div.fenomeni"),
        len = 0;

	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');
        
    $('div.box#'+box_id+' span.highlight').removeClass('selected');    
    $('div.box#'+box_id+' span.highlight.'+hi).addClass("selected");

    $("div.box#"+box_id+" div.fenomeni a").removeClass('selected');
    $(this).addClass("selected");

    fenBox.hide(len).addClass('hidden');
    
    return false;
});


// "reset highlight" inside the 'fenomeni' window
$('div.box a.fen_clear_highlight').live("click", function() {
    var box_id = $(this).parents('div.box').attr('id'),
        len = 0;

	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');
        
    $('div.box#'+box_id+' span.highlight').removeClass('selected');    
    $("div.box#"+box_id+" div.fenomeni a").removeClass('selected');

    $("div.box#"+box_id+" div.fenomeni").hide(len).addClass('hidden');

    return false;
});


// .inBoxNavigation links: found inside boxes, for example next/prev buttons
$("div.box a.inBoxNavigation").live("click", function() {

    var href = $(this).attr('href'),
        data_values = getParametersFromUrl(href),
        resource = data_values['resource'],
        box_id = $(this).parents('div.box').attr('id'),
        // context = data_values['contexts'],
        info = getBoxInfoFromMethod(data_values['method']);

	// If we have at least a facsimile box open.. let's try to move to
	// next or prev facsimile as well
	if ($('div.box.facsimile').length > 0) {

		var cont = $(this).parent().parent();

		// Currently displayed facsimile data
		var fac_href = $('p.anastatica a.anas', cont).attr('href'),
		 	fac_values = getParametersFromUrl(fac_href),
		 	// context = fac_values['context'],
		 	fac_res_id = "b_"+$.base64Decode(fac_values['resource']),
		 	fac_info = getBoxInfoFromMethod(fac_values['method']);
		
		// new (next or prev) facsimile data
		var new_fac_href = ($(this).hasClass('prev')) ? $('p.anastatica a.prev', cont).attr('href') : $('p.anastatica a.next', cont).attr('href'),
		 	new_fac_values = getParametersFromUrl(new_fac_href),
			new_fac_res_id = "b_"+$.base64Decode(new_fac_values['resource']);

		// If there is the proper facsimile box open
		var fac_box_id = myBoxView.getIdFromResId(fac_res_id);
		if (fac_box_id != -1) {

			myBoxView.setLoading(fac_box_id, true);

		    $.ajax({
		        type: ajaxMethod,
		        url: ajaxApiUrl, 
		        data: new_fac_values, 
		        success: function(data) { 

		            var h = {};
		            if (checkJson(data, h) == false)
		                return false;

                    myBoxView.replaceBoxContent(fac_box_id, {newQstring: fac_href, newContent: h['html'], newResId: new_fac_res_id, newTitle: h.data.box, newVerticalTitle: fac_info.vertPrefix+' '+h.data.box});
					myBoxView.setLoading(fac_box_id, false);
		            return false;
		        }
		    });
			
		} // if myBoxView.getIdFromResId() 
	} // if $(.facsimile).length > 0

    // And finally update the trascription
	myBoxView.setLoading(box_id, true);
    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 

            var h = {};
            if (checkJson(data, h) == false)
                return false;

            myBoxView.replaceBoxContent(box_id, {newQstring: href, newContent: h['html'], newResId: "b_"+$.base64Decode(resource), newTitle: h.data.box, newVerticalTitle: info.vertPrefix+' '+h.data.box});
			myBoxView.setLoading(box_id, false);
            return false;
        }
    });

    return false;

});


// a.boxIndexNodeTools links: collapsed index link inside the index box,
// will expand (get through ajax and inject) its box
$('div.box div.boxIndexNodeTools p.collapse a.collapsed').live("click", function() {

    var self = $(this),
        href = self.attr('href'),
        data_values = getParametersFromUrl(href),
        div = self.parent().parent(),
        box_id = self.parents('div.box').attr('id'),
        len = 0;

	if (myPrefs.get('animations'))
	    len = myPrefs.get('animationsLength');

    // Break if we're already loading this box
    if (typeof(boxesBeingLoaded[href]) != 'undefined')
        if (boxesBeingLoaded[href]) 
            return false;
        
    boxesBeingLoaded[href] = true;
	myBoxView.setLoading(box_id, true);

    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 

            boxesBeingLoaded[href] = false;
            self.removeClass('collapsed').addClass('expanded');
            div.removeClass('list').addClass('tree');

            var h = {};
            if (checkJson(data, h) == false)
                return false;

            // If there's the DisplayingLeaves attribute to true, means that
            // we are display leaves of a list-view: hides the view icon
            if (typeof(h.data['DisplayingLeaves']) != 'undefined') 
                if (h.data['DisplayingLeaves'] == 'true')
                    div.removeClass('list').removeClass('tree');

            div.after(h.html);
            div.next().hide().show(len);
            
            myBoxView.setLoading(box_id, false);
			
            return false;
        } // success()
    });
    
    return false;
});


// Index .indexSwitchView : switches view type from list to tree and vice versa
$('div.box div.boxIndexNodeTools p.vista a.indexSwitchView').live("click", function() {

    var self = $(this),
        href, data_values,
        div = self.parent().parent(),
        box_id = self.parents('div.box').attr('id');

    // What view do we have to load ? 
    if (div.hasClass('tree')) {
        href = self.attr('href');
        div.removeClass('tree').addClass('list');
    } else {
        href = div.find('p.collapse a.list').attr('href');
        div.removeClass('list').addClass('tree');
    }

    data_values = getParametersFromUrl(href);

    // Break if we're already loading this box
    if (typeof(boxesBeingLoaded[href]) != 'undefined')
        if (boxesBeingLoaded[href]) 
            return false;

    myBoxView.setLoading(box_id, true);

    $.ajax({
        type: ajaxMethod,
        url: ajaxApiUrl, 
        data: data_values, 
        success: function(data) { 

            boxesBeingLoaded[href] = false;

            var h = {};
            if (checkJson(data, h) == false)
                return false;

            // If there's the DisplayingLeaves attribute to true, means that
            // we are display leaves of a list-view: hides the view icon
            if (typeof(h.data['DisplayingLeaves']) != 'undefined') 
                if (h.data['DisplayingLeaves'] == 'true')
                    div.removeClass('list').removeClass('tree');
                
            div.next().remove();
            div.after(h.html);
            myBoxView.setLoading(box_id, false);

            return false;
        } // success()
    });
    
    return false;
});



// ImageMapperTool Viewer handling

// Initialization: IMT will call this when it's ready to load an image
function jsapi_initializeIMW(id) {
	var b64 = $('#'+id+" embed").attr('b64');
	getFlashObject(id).initialize(b64, 1);
} // jsapi_initializeIMW()

function getFlashObject(movieName) {
	if (navigator.appName.indexOf("Microsoft") != -1) {
		return window[movieName];		
	} else {
		var obj = document[movieName];
		if (obj.length != 'undefined') {
			for(var i=0;i<obj.length;i++) { 
				if(obj[i].tagName.toLowerCase() == 'embed') return obj[i]; 
			}
		}
		return obj;
	}
}

function jsapi_mouseOver(fid, ki) {	
	$("span.image-keyword[title='"+ki+"']").addClass('highlight');
}
function jsapi_mouseOut(fid, ki) {
	$("span.image-keyword[title='"+ki+"']").removeClass('highlight');
}
function jsapi_mouseClick(fid, ki) {
	return true;
}
$('span.image-keyword').live("mouseover", function() {
	var fid = $(this).parents('div.box').find('object.IMTViewer').attr('id');
	var kid = $(this).attr('title');
	getFlashObject(fid).setPolygonHighlighted(true, kid);
	return true;
});

$('span.image-keyword').live("mouseout", function() {
	var fid = $(this).parents('div.box').find('object.IMTViewer').attr('id');
	var kid = $(this).attr('title');
	getFlashObject(fid).setPolygonHighlighted(false, kid);
	return false;
});



// boxIndexNodeTools .expanded: expanded index link, inside the index box, will
// collapse (removing the div) its box
$('div.box div.boxIndexNodeTools a.expanded').live("click", function() {
    $(this).removeClass('expanded').addClass('collapsed');
    $(this).parent().parent().next().remove();
    $(this).parent().parent().removeClass('list').removeClass('tree');
    return false;
});