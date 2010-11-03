// Returns the selected contexts in the current page
function getSelectedContexts() {
	var selected_contexts = "";
	$('div#menu_container input:checkbox:checked').each(function() {
		selected_contexts += "," + $(this).attr('value');
	});
	return selected_contexts.substring(1);
} // getSelectedContexts()


// Reads an URL and returns an hash with its parameters as key => value
function getParametersFromUrl(url) {
	var params = url.split("?")[1],
		foo = params.split("&"),
		resource = null,
		data_values = {};
	
	// Parse parameters of the clicked link and build an hash with key => values
	// TODO: try catch if parse fails
	for (i in foo) {

		// Look for the first "=" and split the string in key => value
		var pos   = foo[i].indexOf('='),
			key   = foo[i].substring(0, pos),
			value = foo[i].substring(pos + 1); 

			if (key == "resource")
				resource = value;
			data_values[key] = value;
	}
	
	// No resource for these methods, but resource will be
	// used as res_id, so just fake one
	switch (data_values['method']) {
        case 'getMyDoni':
	    case 'getIntro':
	    case 'getEdition':
	        data_values['resource'] = $.base64Encode(data_values['method']);
	        break;
        default:
	}
	
	return data_values;
	
} // getParametersFromUrl()


function getBoxInfoFromMethod(method) {

    switch (method) {
        /*
            // TODO: pull off old doni methods
        case "getTranscription" : 
            return {boxType: "transcription", vertPrefix: "Trascrizione: "};
        case "getFacsimile" : 
            return {boxType: "facsimile", vertPrefix: "Anastatica: "};
        case "getImageInfo" : 
            return {boxType: "imageInfo", vertPrefix: "Scheda immagine: "};
	    case "getQuotation" : 
	        return {boxType: "quotation", vertPrefix: "Scheda Riscrittura: "};
        case "getEdition" : 
            return {boxType: "edition", vertPrefix: ""};
        case "getHelp" : 
            return {boxType: "help", vertPrefix: ""};
        case "getMyDoniLoggedIn":
        case "getMyDoni" :
            return {boxType: "myDoni", vertPrefix: ""}; 
        case "myDoniGetNotebook":
            return {boxType: "myDoniNotebook", vertPrefix: "Notebook: "}; 
        */
        case "getIntro" : 
            return {boxType: "intro", vertPrefix: ""};
        case 'getSource':
            return {boxType: 'source', vertPrefix: "Source: "};
        case 'filter':
            return {boxType: 'index', vertPrefix: "Index: "};
        default : 
            console.log("############### Unknown method "+method);
            return {boxType: "resourceBox", vertPrefix: "??? Tipo di box???: "};
    }
} // getBoxInfoFromMethod


// Updates the undobutton in the UI, using the class to switch
// its image
function updateUndoButton() {
    var n = myBoxView.getUndoNumber(),
        b = $('#undoButton');
    if (n > 0)  
        b.removeClass('inactive');
     else 
        b.addClass('inactive'); 
}


// Tracks an ajax page with google analytics
function gTrack(url) {
    var _pageTracker = _gat._getTracker("UA-17604259-1");
    _pageTracker._trackPageview(url);
}