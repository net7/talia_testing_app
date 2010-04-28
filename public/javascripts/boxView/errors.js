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

	$('#errorDialog').html(dateString + ": " + msg);
	$('#errorDialog').dialog('open');
	
} // displayError()

// Will try to parse the given json and set the properties on the ret object
// Returns false if there were an error (either during eval or in the error field)
function checkJson(json, ret) {

	try {
		// Try to parse the json
		var h = eval ("("+JSON.stringify(json)+")");

		// If there's no error field... this is an error!
		if (typeof(h['error']) == "undefined") {
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
		// Some error in the try block .. maybe unable to parse the given json
		var str = "Server error.<br/><br/>Error parsing the data coming from server, try again later.." + 
				  "<br><br />You may want to try to <a href='#' class='refreshPage'>reload this page</a>";
//		displayError(str);
    displayError(e)
		return false;
	}
	
} // checkJson


$.ajaxSetup({
	beforeSend: function() {displayLoading();},
	error: function(err) {displayError("AJAX network error.<br/><br/>Try again later...");},
	complete: function() {hideLoading();}
});


$(document).ready(function() {

	// Initialize the Errors modal dialog
	$('#errorDialog').dialog({title: "Error !", modal: true, autoOpen: false});

	$('div#errorDialog a.refreshPage').live("click", function() {
		window.location.reload(false);
		return false;
	});

});
