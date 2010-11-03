// Using a counter so if we try to open it multiple times, we
// are sure to close it when the last request is done
var loadingCounter = 0;

// Displays the loading dialog
function displayLoading() {
	$('div#loadingDialog').show();
	loadingCounter++;
} // displayLoading()

function hideLoading() {
	if (--loadingCounter == 0)
		$('div#loadingDialog').hide();
} // hideLoading()


// Displays the error window
function displayError(msg) {

	var date = new Date(),
		dateString = date.getDay() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " +
					 date.getHours() + "." + date.getMinutes() + "." + date.getSeconds();

	$('#errorDialog').html(dateString + ":<br> " + msg);
	$('#errorDialog').dialog('open');
	
} // displayError()

// Will try to parse the given json and set the properties on the ret object
// Returns false if there were an error (either during eval or in the error field)
// if q == true the errors coming from bad response (not a json) or a json without
// error field  will not get displayed as usual
function checkJson(json, ret, q) {

    var quiet = (typeof(q) == "undefined") ? false : q;

	try {
		
		// Try to parse the json
        var h = eval ("("+JSON.stringify(json)+")");

		// If there's no error field... this is an error!
		if (!quiet && typeof(h['error']) == "undefined") {
			var str = "Server error.<br/><br/>The json doesnt have an error field.." +
					  "<br><br />You may want to try to <a href='#' class='refreshPage'>reload this page</a>";
			displayError(str);
			return false;
		}

		// Copy h's values into ret
		$.extend(ret, h);

		// Error field is 0 ==> no error
		if (parseInt(h['error']) == 0)
			return true;

		// Otherwise we have an error .. :\
		displayError(h.error +": " + h.message);
		return false;

	} catch (e) { 
	    
		var str = "Il server ha restituito un contenuto non valido.";
	    
	    if (typeof(json) == "string") {
	        if (json.match(/HTTP Basic: Access denied/))
	            str = "Devi essere loggato per poter caricare dei notebooks";

	    }
	    
		// Some error in the try block .. maybe unable to parse the given json
        if (!quiet) displayError(str);
		return false;
	}
	
} // checkJson


// Common to every ajax request
$.ajaxSetup({
	beforeSend: function() { displayLoading(); },
	error: function(XMLHttpRequest, textStatus, errorThrown) {
	    if (textStatus == "timeout") {
    	    displayError("Il server al momento e' troppo occupato, riprovare fra qualche minuto.");
	    } else {
    	    displayError("Errore di rete, riprovare fra qualche minuto.");
	    }
        hideLoading();
	},
	complete: function() { hideLoading(); },
	timeout: 180000
});


$(document).ready(function() {

	// Initialize the Errors modal dialog
	$('#errorDialog').dialog({title: "Errore", modal: true, autoOpen: false});

});
