(function($) {  

	$.doniPrefs = function (opts) {
		this.options = $.extend({}, $.doniPrefs.defaults, opts);
		this.init();
	}; // $.doniPrefs()

	$.doniPrefs.defaults = {

        // Animations yes/no, length in ms
        animations: true,
        animationsLength: 300,

        // .resizeme images max width, 0=dont limit
        resizemeImagesMaxWidth: 400,

        useCookie: false,
        cookieExpireDays: 365,
        cookieName: 'DoniPreferences',

        // Hopefully will come from initialization
        bookmarks: null,
        boxView: null,
        eztip: null
    };
    
    $.doniPrefs.prototype = {
        
        init : function() {

            var self = this;

            self.loggedIn = false;

            // Read preferences from the cookie, if there's one
            this.readCookie();

            // Initialize the animations correctly
            self.setAnimations(self.options.animations);
            self.setResizemeImagesWidth(self.options.resizemeImagesMaxWidth);

        	$("#prefDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 300,
        		modal: false,
        		buttons: {
        			'OK' : function () { $(this).dialog('close'); }
        		},
        		close: function() {}
        	});

            // Message dialog initialization
            $("#messageDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 200,
        		width: 400,
        		modal: true,
        		buttons: {
        			'Chiudi': function () { $(this).dialog('close'); }
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
                var new_value = (self.options.animations) ? 0 : 1;
                self.setAnimations(new_value);
                if (self.options.useCookie) self.writeCookie();
                return true;
        	});

            $('#prefsImagesMaxWidth').change(function() {
                var new_value = $('#prefsImagesMaxWidth option:selected').val()
                self.setResizemeImagesWidth(new_value);
                if (self.options.useCookie) self.writeCookie();
                return true;
            });

        	// Use Cookie checkbox: erase the cookie
        	$('#prefsUseCookie').click(function() {
                // Erase the cookie (setting it to null) or write it properly
                if (!this.checked) {
                    document.cookie = [self.options.cookieName, '=', null, '; expires=-1'].join('');
                    self.setUseCookie(false);
                } else {
                    self.setUseCookie(true);
                    self.writeCookie();
                }
                return true;
        	});

            $('.box.myDoni .myDoniLoginButton').live('click', function(e) {
                self.login();
                return true;
            });

            $('.box.myDoni button.logout').live('click', function(e) {
                self.logout();
                return true;
            });
        	

        }, // init()

        login : function() {
            var self = this,
                user = $('#myDoniUser').val(),
                pass = $('#myDoniPassword').val(),
                myDoniId = $('div.box.myDoni').attr('id');

            self.options.boxView.setLoading(myDoniId, true);
                
            self.log("Logging in with "+user+" and "+pass);

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: {method: 'myDoniLogin', u: user, p: pass}, 
                success: function(data) {

                    self.options.boxView.setLoading(myDoniId, false);

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        displayError("Username e/o password sbagliate, riprova");
                        self.log("User e pass sbagliate al login");
                        return false;
                    }

                    self.log("Login done ! "+h['data'].lenght+" objects received");

                    self.loggedIn = true;

                    // Set internal user/pass for next requests
                    self.options.bookmarks.setUserPass(user, pass);

                    // Set the internal notebooks javascript structures
                    self.options.bookmarks.setNotebooks(h['data']['notebooks']);
                    self.options.bookmarks.setMyDoniBox(h['data']['my_doni_html']);
                    self.options.bookmarks.refreshMyDoniBoxWidgets();
                    
                    // Set user's preferences
                    self.setPrefFromValues(h['data']['prefs']);
                    if (self.options.useCookie) self.writeCookie();
                                        
                } // success()
            });
            
        }, // login()

        logout : function() {
            var self = this;
            
            self.options.bookmarks.logout();
            self.loggedIn = false;
            self.setName(null);
            self.writeCookie();
            self.log("Logged out");
        }, // logout()

        isLoggedIn : function () {
            return this.loggedIn;
        },

        // Returns the preferences string to be saved in the cookie or elsewhere
        getPrefString : function () {
            var s = "";

            s += "animations=" + this.options.animations;
            s += "&";
            s += "resizemeImagesMaxWidth=" + this.options.resizemeImagesMaxWidth;
            s += "&";
            s += "useCookie=" + this.options.useCookie;
            s += "&";
            s += "name=" + this.options.name;
            
            // s += "OtherOption=" + "1";
            
            return $.base64Encode(s);
        }, // getPrefString()

        // Sets the preferences reading the string we got from the cookie
        setPrefFromString : function (string) {
            var self = this,
                s = $.base64Decode(string),
                chunks = s.split('&'),
                data = {};
              
            for (i in chunks) {
                var el = chunks[i].split('='),
                    key = el[0], value = el[1];
                data[key] = value;

            } // for i in chunks

            self.setPrefFromValues(data);
            
        }, // setPrefFromString()

        // Sets the preferences reading an object (coming from login?)
        setPrefFromValues : function (values) {
            var self = this;

            for (key in values) {
                switch (key) {
                    case 'animations': 
                        self.setAnimations(parseInt(values[key]));
                        break;
                    case 'resizemeImagesMaxWidth':
                        self.setResizemeImagesWidth(parseInt(values[key]))
                        break;
                    case 'useCookie':
                        self.setUseCookie(values[key]);
                        break;
                    case 'name':
                        self.setName(values[key]);
                        break;
                    default:
                } // switch
            }
            
            self.log("SetPrefFromValues for values ");
        }, // setPrefFromValues()

        // Set animations on all sub-components, like boxView, eztip and so on
        setAnimations : function (value) {
            var self = this;
            self.options.animations = (value) ? 1 : 0;

            $('#prefsAnimations')[0].checked = (self.options.animations) ? 1 : 0;

            self.options.boxView.setAnimations(self.options.animations);
            self.options.eztip.setAnimations(self.options.animations);

        }, // setAnimations()
        
        setResizemeImagesWidth : function (value) {
          var self = this;
          
          $('#prefsImagesMaxWidth option[value='+value+']')[0].selected = true;
          
          self.options.resizemeImagesMaxWidth = value;
          self.options.boxView.setResizemeImagesWidth(value);
        },

        setUseCookie : function (value) {
            var self = this;
            self.options.useCookie = (value) ? 1 : 0;
            $('#prefsUseCookie')[0].checked = (self.options.useCookie) ? 1 : 0;
        },

        setName : function (value) {
            var self = this;
            self.options.name = value;
        },
        
        get : function (label) {
            if (typeof(this.options[label] != 'undefined'))
                return this.options[label];
            else
                return undefined;
        }, // get()
        
        readCookie : function () {
            var self = this,
                name = this.options.cookieName,
                cookieValue = "";

            // If there's a cookie, let's read it!
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
                self.setUseCookie(true);
                this.setPrefFromString(cookieValue);
            } else
                self.setUseCookie(false);
            
        }, // readCookie()
        
        // Saves the cookie in the browser
        writeCookie : function () {

            var self = this;
                date = new Date();
            date.setTime(date.getTime() + (this.options.cookieExpireDays * 24 * 60 * 60 * 1000));
            var expires = '; expires=' + date.toUTCString();

            document.cookie = [this.options.cookieName, '=', encodeURIComponent(self.getPrefString()), expires].join('');

            self.log("Cookie written with "+ self.getPrefString())

        }, // writeCookie()
        
        log : function(w) {
	        if (this.options.debug == false) return;

            if (typeof console == "undefined") {
                if ($("#debug_foo").attr('id') == null) 
                    $("body").append("<div id='debug_foo' style='position: absolute; right:2px; bottom: 2px; border: 1px solid red; font-size: 10px;'></div>");
                $("#debug_foo").append("<div>PREF# "+w+"</div>");
            } else                 
                console.log("PREF# "+ w);
	    } // log()
    };

})($);
