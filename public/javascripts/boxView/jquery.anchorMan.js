(function($) {

    // anchorMan constructor
    $.anchorMan = function(opts) {

        // Global options for this boxView, right into the object
        this.options = $.extend({},
        $.anchorMan.defaults, opts);
        this.init();

    };
    // $.anchorMan()

    // DEFAULTS: anchorMan will use these as defaults
    $.anchorMan.defaults = {

        // Characters used to separate sections, subsections and values
        separatorSections: '|',
        separatorSubSections: '@',
        separatorValues: '*',

        // Use url/cookie to store data?
        useUrl: true,
        useCookie: true,

        // Name and expiration date of the cookie
        cookieName: 'anchorMan',
        cookieDateName: 'anchorManDate',
        cookieExpireDays: 365,

        // If url's anchor and cookie have some valid values, which one to use?
        useUrlOrCookie: 'url',

        // Save data on every add/remove ?
        saveOnAdd: true,
        saveOnRemove: true,

        // check url timer time, in ms
 		checkBackButton: true,
       	checkBackButtonTimerMS: 200,

        debug: true

    };



    $.anchorMan.prototype = {
        init: function() {

            // Will keep the add and remove callback functions
            this.addCallbacks = [];
            this.removeCallbacks = [];
            this.changeCallbacks = [];
            this.sortCallbacks = [];

            // The current anchor you can read on the URL
            this.current_anchor = "";

            // Will keep the values taken from the URL's anchor
            this.values = {};

            var url_anchor = "",
            cookie_anchor = "",
            cookie_date = null;

            if (this.options.useCookie) {
                cookie_anchor = this.get_cookie_by_name(this.options.cookieName);
                cookie_date = this.get_cookie_by_name(this.options.cookieDateName);
            }

            if (this.options.useUrl)
            	url_anchor = document.location.hash;

            if (this.options.debug) console.log("Url/cookie: --" + url_anchor + "-- ||| --" + cookie_anchor + "-- (" + cookie_date + ")");

            // Anchorman is configured to use both, choose which one to go
            if (this.options.useCookie && this.options.useUrl) {

                // They have the same value, just use one of them
                if (url_anchor == cookie_anchor) {
                    if (this.options.debug) console.log("Cookie and url match: easy!")
                    this.current_anchor = url_anchor;

                    // They dont match and cookie is null
                } else if (url_anchor != "" && cookie_anchor == "") {
                    this.current_anchor = url_anchor;
                    if (this.options.debug) console.log("Using url");

                    // They dont match and url is null
                } else if (url_anchor == "" && cookie_anchor != "") {
                    this.current_anchor = cookie_anchor;
                    if (this.options.debug) console.log("Using cookie since url anchor is empty");

                    // They dont match... look at the useUrlOrCookie variable
                } else if (this.options.useUrlOrCookie == "url") {
                    if (this.options.debug) console.log("OMG, which one?? using url since useUrlOverCookie is url");
                    this.current_anchor = url_anchor;

                } else if (this.options.useUrlOrCookie == "cookie") {
                    if (this.options.debug) console.log("OMG, which one?? using COOKIE since useUrlOverCookie is cookie");
                    this.current_anchor = cookie_anchor;
                } else if (this.options.useUrlOrCookie == "ask") {

                    if (this.options.debug) console.log("OMG, which one?? Ask??");

                    var q = "Mr. AnchorMan found you have a saved session on " + this.get_cookie_by_name(this.options.cookieDateName) + "\n\n"
                    + "Press OK to load it or CANCEL to delete it and load the page you asked for."

                    if (confirm(q))
                    this.current_anchor = cookie_anchor;
                    else
                    this.current_anchor = url_anchor;
                }

                // We are not using url
            } else if (this.options.useCookie && !this.options.useUrl) {
                this.current_anchor = cookie_anchor;

                // We are not using cookie
            } else if (!this.options.useCookie && this.options.useUrl) {
                this.current_anchor = url_anchor;
            }

            // Parse the values from the given string
            this.values = $.extend({}, this.get_values_from_anchor(this.current_anchor), {});

            var self = this;

            // Start the check_url timer
			if (this.options.checkBackButton)
            	this.checkUrlTimer = setInterval(function() { self.check_url(); }, this.options.checkBackButtonTimerMS);

        }, // init()



		// Serialize the values of the tree:
		// ret[name] will be something like: [0 => "val1,val2,val3", 1 => "val1,val2,val3"]
		// ret["s_"+name] will be: ["val1,val2,val3" => 0, "val1,val2,val3" => 1]
		serialize_values : function(values) {
			var ret = {};
			for (name in values) {

				ret[name] = [];
				ret["s_"+name] = [];
				
				for (i in values[name]) {
					var foo = values[name][i].join(",");
					ret[name][i] = foo;
					ret["s_"+name][foo] = i;
				}
			}
			return ret;
		},
		

        check_url: function() {

            if (document.location.hash.substring(1) != this.current_anchor) {

                // Copy old values hash into a temporary variable
                var oldValues = $.extend({}, this.values, {});

                // Parse the values from the given string
                var newValues = $.extend({}, this.get_values_from_anchor(document.location.hash), {});

				var serOld = $.extend({}, this.serialize_values(oldValues), {}), 
					serNew = $.extend({}, this.serialize_values(newValues), {});
				
                // The only things we can find here are:
                // ABC -> AB : elements has been removed
                // ABC -> ABCD : elements has been added
                // ABC -> BCA : order has changed
                // ABC -> ADE : multiple elements has been modified
				// "" -> A
				// A -> ""
                // Cycle over all sections

                for (name in oldValues) {

					if (this.options.debug) console.log("(((CHECK URL))) " + name + ": " + typeof(serNew[name]) + " // " + typeof(serNew[name]));

					if (typeof(serNew[name]) == "undefined") {

						if (this.options.debug)	console.log("Section "+name+" was there .. but disappeared!!");
						if (this.options.debug) console.log("Found a removed item: " + serOld[name][0]);

						if (typeof(this.removeCallbacks[name]) == "function") {
	                        if (this.options.debug) console.log("Calling REMOVE callback for " + name + "/" + " with values: " + oldValues[name][0])
	                        this.removeCallbacks[name].apply(this, oldValues[name][0]);
		                }
						continue;

					} // typeof == undefined

					// This section didnt change, skip it
					if (serOld[name].join(",") == serNew[name].join(",")) {
					    if (this.options.debug) console.log("## SKIPPING section "+name+": old == new");
						continue;
					} else {
					    if (this.options.debug) console.log("@@ section "+name+" old != new: "+serOld[name].join(",")+" >> "+serNew[name].join(","));
					}

					// #OLD > #NEW: back action removed an item
					if (oldValues[name].length > newValues[name].length) {

						if (this.options.debug) console.log("OLD > NEW: removed item?");

						for (var i=0; i<serOld[name].length; i++) {

							var foo = serOld[name][i];

							if (this.options.debug) console.log("FOO: "+foo+ " -> " + serNew["s_"+name][foo] + " LENGTH: " + serOld[name].length);

							if (typeof(serNew["s_"+name][foo]) == "undefined") {

								if (this.options.debug) console.log("Found a removed item: " + serOld[name][i]);

								if (typeof(this.removeCallbacks[name]) == "function") {
			                        if (this.options.debug) console.log("Calling REMOVE callback for " + name + "/" + " with values: " + oldValues[name][i])
			                        this.removeCallbacks[name].apply(this, oldValues[name][i]);
				                }
							} // if typeof serOld == undefined
						} // for i

						
					// #NEW > #OLD: back action added an item
					} else if (oldValues[name].length < newValues[name].length) {

						if (this.options.debug) console.log("NEW > OLD: added item?");

						for (var i=0; i<serNew[name].length; i++) {
						
							var foo = serNew[name][i];
							
							if (this.options.debug) console.log("FOO: "+foo+ " -> " + serOld["s_"+name][foo] + " LENGTH: " + serNew[name].length);
							
							if (typeof(serOld["s_"+name][foo]) == "undefined") {

								if (this.options.debug) console.log("Found an added item: " + serNew[name][i]);

								if (typeof(this.addCallbacks[name]) == "function") {
									// Adding the box back in his original position, otherwise the url will
									// change (same boxes but different order)
									newValues[name][i].push(i);
			                        if (this.options.debug) console.log("Calling ADD callback for " + name + "/" + " with values: " + newValues[name][i])
			                        this.addCallbacks[name].apply(this, newValues[name][i]);
				                }
							} // if typeof serOld == undefined
						} // for i


					// #NEW = #OLD: they got sorted? value changed?
					} else { 
						
						var changedCalled = false;
						
						// Cycle over serialized items and look for an item
						// who is not in the old array: the changed one!
						// console.log("Occhio a " + name);
						for (var i=0; i<serNew[name].length; i++) {
							
							var foo = serNew[name][i];
							if (typeof(serOld["s_"+name][foo]) == "undefined") {

		                        if (this.options.debug) console.log("Found a changed item:" + oldValues[name][i] + " >> " + newValues[name][i]);
								if (typeof(this.removeCallbacks[name]) == "function") {
			                        if (this.options.debug) console.log("Calling CHANGE callback for " + name + " with values: " + oldValues[name][i])
			                        this.changeCallbacks[name].call(this, newValues[name][i], oldValues[name][i]);
									changedCalled = true;
				                }
								
							} // if typeof == undefined

						} // for i
						
						// Did we call the onChange callback? If some value has changed, they
						// didnt get sorted; on the other hand, if no value has changed but
						// hash has, for sure boxes got sorted.
						if (changedCalled == false) {
	                        if (this.options.debug) console.log("Calling SORT callback for " + name + " with values: " + newValues[name])
							this.sortCallbacks[name].call(this, newValues[name]);
						}
						
						
					}

                } // for name

            } // if doc.loc.hash != current_anchor
 
       	}, // check_url()

        // Let's call the callbacks!
        call_init_callbacks: function() {

            var values = [];
			values = $.extend({}, this.values, {});

            // Cycle over sections
            for (var name in values) {

                // If there's an addCallback with the same name ..
                if (typeof(this.addCallbacks[name]) == "function") {

                    // Cycle over all subsections and call the callback with
                    // the values from the current subsection
                    for (var i in values[name]) {
                        if (this.options.debug) console.log("Calling callback for " + name + "/" + i + " with values: " + values[name][i]);
                       	this.addCallbacks[name].apply(this, values[name][i]);

                    } // for i in this.values[name]
                } // if this.classbacks[name] is function
            } // for name in this.values

        }, // call_callbacks()

        // Fills the anchors
        get_values_from_anchor: function(currentAnchor) {

            // No anchor?  .. just return
            if (!currentAnchor)
            return;

            currentAnchor = $.base64Decode(currentAnchor);

            if (this.options.debug) console.log("Parsing decoded anchor: " + currentAnchor);

            // TODO: Put some try-catch here .......
            var foo = [];

            // Divide anchor in sections
            var sections = currentAnchor.substring(1).split(this.options.separatorSections);
            for (i in sections) {

                var name = null;

                // Divide this section in subsections
                var subsections = sections[i].split(this.options.separatorSubSections);
                for (j in subsections) {

                    // First item is always the section name
                    if (name == null) {

                        name = subsections[j]
                        foo[name] = [];

                    } else {

                        // Finally set the values on the section 'name', on the subsection
                        // with index j-1, splitting this subsection
                        foo[name][j - 1] = new Array();
                        foo[name][j - 1] = subsections[j].split(this.options.separatorValues);

                    } // if name == null
                } // for j in subsections
            } // for i in sections

            if (this.options.debug) console.log("----- Final parse : ");
            if (this.options.debug)
            	for (s in foo) {
                	for (i in foo[s]) {
                    	console.log(s + "/" + i + ": " + foo[s][i]);
                	}
            	}

            // Return the object with the values
            return foo;

        }, // get_values_from_anchor()

        // Sets the AnchorMan cookie with the current anchor value
        set_cookie: function() {

            var date = new Date();
            date.setTime(date.getTime() + (this.options.cookieExpireDays * 24 * 60 * 60 * 1000));
            var expires = '; expires=' + date.toUTCString();

            document.cookie = [this.options.cookieName, '=', encodeURIComponent(this.current_anchor), expires].join('');
            document.cookie = [this.options.cookieDateName, '=', new Date(), expires].join('');

            if (this.options.debug) console.log("Setto cookie a: " + [this.options.cookieName, '=', encodeURIComponent(this.current_anchor), expires].join(''));

        }, // set_cookie()

        // Gets the value of the cookie with the given name,
        // returns "" if it's not found/defined
        get_cookie_by_name: function(name) {

            var cookieValue = "";
            if (document.cookie && document.cookie != '') {

                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);

                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
                // for i
            }
            // if document.cookie
            return cookieValue;

        }, // get_cookie_by_name()

        // Builds the current anchor from the hash values then saves it
        // into url's anchor and cookie, if needed
        save: function() {

            // build the anchor from the saved hash
            this.current_anchor = $.base64Encode(this.build_anchor(this.values));

			// save cookie and url's anchor if needed
            if (this.options.useUrl && document.location.hash.substring(1) != this.current_anchor) 
					document.location.hash = this.current_anchor;
			
            if (this.options.useCookie)
            	this.set_cookie();

        }, // save()

        reset: function() {
            this.values = [];
            this.save();
        }, // reset()

        // Update the current anchor with the given values hash
        build_anchor: function(values) {

            var s = "#";
            for (name in values) {

                // Add this section's name with SubSections separator, if there's elements!
				if (values[name].length > 0)
                	s += name + this.options.separatorSubSections;

                // Add values joined by the values separator and add a SubSections separator
                for (i in values[name])
                	s += values[name][i].join(this.options.separatorValues) + this.options.separatorSubSections;

                // Trim off the trailing SubSections separator and add the sections separator
                s = s.substring(0, s.length - 1) + this.options.separatorSections;

            }

            // Trim off the trailing sections separator
            s = s.substring(0, s.length - 1);

            if (this.options.debug) console.log("Final anchor is: " + s);

            return s;
        }, // build_anchor()

        // Adds a callback to be called at page startup
        add_callbacks: function(name, callbacks) {

            if (typeof(callbacks['onAdd']) == "function")  
            	this.addCallbacks[name] = callbacks['onAdd'];

            if (typeof(callbacks['onRemove']) == "function")
            	this.removeCallbacks[name] = callbacks['onRemove'];

	        if (typeof(callbacks['onChange']) == "function")
	          	this.changeCallbacks[name] = callbacks['onChange'];

	        if (typeof(callbacks['onSort']) == "function")
	          	this.sortCallbacks[name] = callbacks['onSort'];

        }, // add_callbacks()

        // Adds a section to the values hash
        add_section: function(name, values) {

            if (this.values[name] === undefined) {
                if (this.options.debug) console.log("Creating section " + name);
                this.values[name] = [];
            }

            var len = this.values[name].length;
            this.values[name][len] = values;
            if (this.options.debug) console.log("Adding to section " + name + " values " + values);

            if (this.options.saveOnAdd)
            	this.save();

        }, // add_section()

        // Overwrites an entire section with the given values,
        // it's like remove/add actions at once
        set_section: function(name, values) {

            if (this.options.debug) console.log("AM Set Section " + name + " to: " + values);

            this.values[name] = values;
            this.save();

        }, // set_section()

        // Removes a section from the values hash
        remove_section: function(name) {

            if (this.values[name] === undefined) {
                if (this.options.debug) console.log("Non c'e' nessuna sezione " + name);
                return;
            }

            var foo = {};
            for (item in this.values)
            	if (item != name)
            		foo[item] = this.values[item];

            this.values = $.extend({}, foo, {});

            if (this.options.debug) console.log("Rimossa sezione " + name);
            if (this.options.saveOnRemove)
            	this.save();

        } // remove_section()

    };



})(jQuery);
