(function($) {  

	$.doniPrefs = function (opts) {
		this.options = $.extend({}, $.doniPrefs.defaults, opts);
		this.init();
	}; // $.doniPrefs()

	$.doniPrefs.defaults = {
        animations: 0,
        animationsLength: 300,

        useCookie: 0,
        cookieExpireDays: 365,
        cookieName: 'DoniPreferences',

        boxView: null,
        eztip: null
    };
    
    $.doniPrefs.prototype = {
        
        init : function() {

            var self = this;

            // Read preferences from the cookie, if there's one
            this.readCookie();

            // Initialize the animations correctly
            self.setAnimations(self.options.animations);

        	$("#prefDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 300,
        		modal: true,
        		buttons: {
        			'OK' : function () { $(this).dialog('close'); }
        		},
        		close: function() {}
        	});

            // Open the preferences panel
        	$('#prefButton').click(function() {
        		$('#prefDialog').dialog('open');
        		return false;
        	})

        	// Animations checkbox: toggle animations
        	$('#prefsAnimations').click(function() {
        		self.options.animations = (self.options.animations) ? 0 : 1;
                self.setAnimations();
                if (self.options.useCookie) self.writeCookie();
                return true;
        	});

        	// Use Cookie checkbox: erase the cookie
        	$('#prefsUseCookie').click(function() {
                // Erase the cookie (setting it to null) or write it properly
                if (!this.checked) {
                    document.cookie = [self.options.cookieName, '=', null, '; expires=-1'].join('');
                    self.options.useCookie = 0;
                } else {
                    self.options.useCookie = 1;
                    self.writeCookie();
                }
                return true;
        	});
        	

        }, // init()

        // Returns the preferences string to be saved in the cookie
        getPrefString : function () {
            var s = "";

            s += "animations=" + this.options.animations;
            
            // s += "&";
            // s += "OtherOption=" + "1";
            
            return $.base64Encode(s);
        }, // getPrefString()

        // Sets the preferences reading the string we got from the cookie
        setPrefFromString : function (string) {
            var s = $.base64Decode(string);

            var chunks = s.split('&');
            for (i in chunks) {

                var el = chunks[i].split('=');
                switch (el[0]) {
                    
                    case 'animations': 
                        this.options.animations = parseInt(el[1]); 
                        break;
                        
                    default:
                } // switch
            } // for i in chunks
            
        }, // setPrefFromString()

        // Set animations on all sub-components, like boxView, eztip and so on
        setAnimations : function (value) {

            self = this;

            $('#prefsAnimations').each(function() {
                this.checked = (self.options.animations) ? true : false;
            });

            self.options.boxView.setAnimations(self.options.animations);
            self.options.eztip.setAnimations(self.options.animations);

        }, // setAnimations()
        
        
        get : function (label) {
            if (typeof(this.options[label] != 'undefined'))
                return this.options[label];
            else
                return undefined;
        }, // get()
        
        
        readCookie : function () {
            
            var name = this.options.cookieName;
            var cookieValue = "";

            // There's the cookie, let's read it!
            if (document.cookie && document.cookie != '') {

                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);

                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                } // for i
            } // if document.cookie
            
            
            if (cookieValue != "") {
                
                // Check the "use cookie" preference
                $('#prefsUseCookie').each(function() { this.checked = true; });
                this.options.useCookie = 1;
                this.setPrefFromString(cookieValue);
            }
            
        }, // readCookie()
        
        // Saves the cookie in the browser
        writeCookie : function () {

            var date = new Date();
            date.setTime(date.getTime() + (this.options.cookieExpireDays * 24 * 60 * 60 * 1000));
            var expires = '; expires=' + date.toUTCString();

            document.cookie = [this.options.cookieName, '=', encodeURIComponent(this.getPrefString()), expires].join('');

        } // writeCookie()

    };

})($);
