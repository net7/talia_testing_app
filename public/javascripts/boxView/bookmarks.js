(function($) {  
	
 	// Bookmarks constructor
	$.bookmarks = function (opts) {
		this.options = $.extend({}, $.bookmarks.defaults, opts);
		this.init();
	}; // $.bookmarks()

	$.bookmarks.defaults = {

        boxView: null,
        bookmarkServer: null,
		debug: false
	};

	$.bookmarks.prototype = {
		init : function() {
            var self = this;

            // Will contain every notebook we are displaying: my and subscribed
            // with a flag to distuinguish them
            this.nb = [];
            
            // Will contain data about the box the user is watching at,
            // to be ready to bookmark them
            this.boxes = [];
            
            // User and pass to save and query the bookmarks from
            this._user = null;
            this._pass = null;
            
            // Enter key, let's catch it for our various forms
            $(document).keypress(function(event) {
                if (event.keyCode != '13')
                    return true;

                // Check: mydoni box open, email len, a pass, not logged in
                if ($('div.myDoni.box').length > 0 && !self.loggedIn() 
                    && $('#myDoniUser').val().length > 6 && $('#myDoniPassword').val().length > 1) {
                    myPrefs.login();
                    event.preventDefault();
                }

                // TODO: catch enter key for bookmark and notebook dialog as well? 

            });


            // Signup dialog initialization
            $("#signupDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 500,
        		width: 400,
    			clearStyle: true,
        		modal: true,
        		buttons: {
        			'Chiudi': function () { $(this).dialog('close'); }
        		},
        		close: function() {}
        	});
        	
            // Bookmark dialog initialization
            $("#bookmarkDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 500,
        		width: 400,
    			clearStyle: true,
        		modal: false,
        		buttons: {
        			'Chiudi': function () { $(this).dialog('close'); }
        		},
        		close: function() {}
        	});
        	
            // Notebook dialog initialization
            $("#notebookDialog").dialog({
        		bgiframe: true,
        		autoOpen: false,
        		height: 300,
        		width: 400,
    			clearStyle: true,
        		modal: true,
        		buttons: {
        			'Chiudi': function () { $(this).dialog('close'); }
        		},
        		close: function() {}
        	});

            // Bookmark button click
            $('p.boxTool.bookmarkTool').live('click', function() {
                var id = $(this).parents('div.box').attr('id');
                self.editBookmarks(id);
                return false;
            });

            // a.myDoni links handling ..
            $('div.box a.myDoni').live('click', function() {
                var data_values = getParametersFromUrl($(this).attr('href'));
                
                switch (data_values['method']) {

                    case "getMyDoniUserSignup" :
                        self.showSignupDialog();
                        break;

                    case "getMyDoniForgotPassword":
                        var e =  $("#myDoniUser").val();
                        if (e == "") {
                            $("#messageDialog").html("Inserisci il tuo indirizzo email nell'apposito campo per recuperare la tua password.");
                            $("#messageDialog").dialog('open');
                        } else {
                            data_values['params'] = e;
                            $.ajax({
                                type: 'POST',
                                url: ajaxApiUrl, 
                                data: data_values, 
                                success: function(data) {
                                    $("#messageDialog").html("<p>La tua richiesta è stata ricevuta.</p><br><p>Se l'indirizzo "+e+" è presente nei nostri database, a breve riceverai una email con le istruzioni su come creare una nuova password per il tuo account.</p>");
                                    $("#messageDialog").dialog('open');
                                    return false;
                                } // success
                            });
                            
                        }
                        return false;
                        break;

                    case "myDoniCreateNotebook" : 
                        self.createNotebook();
                        break;

                    case "myDoniEditNotebook" : 
                        self.editNotebook(data_values);
                        break;

                    case "myDoniGetBookmarkDialogFromUri":
                        self.showBookmarkDialogFromUri(data_values);
                        break;

                    case "myDoniUnfollowNotebook":
                        self.unFollowNotebook(data_values);
                        break;

                    case "myDoniDeleteNotebook":
                        self.deleteNotebook(data_values);
                        break;

                    case "myDoniDeleteBookmark":
                        self.deleteBookmark(data_values);
                        break;

                    case "myDoniGetNotebook":
                        data_values['u'] = self._user;
                        data_values['p'] = self._pass;
                        data_values['href'] = $(this).attr('href');
                        _loadAuthResource(data_values);
                        break;
                }
                
                return false;
            });

            // Bookmark dialog: new notebook button
            $('button.bm_newnb_button').live('click', function() {
                $('#notebookDialog').addClass('from_bookmark_dialog');
                self.showNotebookDialog();
                return false;
            });
            
            // Bookmark dialog: save new bm button
            $('button.bm_save_button').live('click', function() {
                self.save_bookmark(this);
                return false;
            });

            // Notebook dialog: save new nb button
            $('button.nb_save_button').live('click', function() {
                if (!$('#notebookDialog').hasClass('ignore_clicks'))
                    self.save_notebook(this);
                return false;
            });
            
            // Signup dialog: save user button
            $('button.signup_save_button').live('click', function() {
                // if (!$('#notebookDialog').hasClass('ignore_clicks'))
                self.save_user(this);
                return false;
            });
        
        }, // init()

        loggedIn : function () { return this._user != null && this._pass != null; },

        // Will clean up the query string from useless parameters (type etc)
        sanitizeQString : function (qstring) {
            var self = this,
                params = getParametersFromUrl(qstring),
                retString = "",
                page = qstring.split("?")[0];
            
            for (key in params) 
                switch (key) {
                    case 'method':
                    case 'lang':
                    case 'resource':
                    case 'contexts':
                        retString += "&"+key+"="+params[key];
                        break;
                    default:
                }
                
            return page+"?"+retString.substring(1);
            
        }, // sanitizeQString()

        // Loads the bookmarks from a given object, coming from outside (login?)
        setBookmarks : function (obj) {
            this._updateBM(obj);
        },

        // Called from the autocompleter thingie with an object containing
        // data about the notebook and a string with the input's content
        followNotebook : function(obj, string) {
            var self = this,
                myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);
            
            self.log("Following notebook "+string);

            if (obj.item['value'] != string)
                self.log(" ERROR? WUT? "+obj.item['value'] +" != "+ string);
                
            var data_values = {u: self._user, p: self._pass, method: 'myDoniFollowNotebook', resource: obj.item['id']};

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("Json invalido su followNotebook .. uh?");
                        return false;
                    }

                    self.refreshMyDoniBox(function() { self.refreshMyDoniBoxWidgetsFromNotebook(h.html); });
                    self.log("Now following notebook "+h.html);

                } // success
            });

        }, // followNotebook()

        unFollowNotebook : function(data_values) {
            var self = this,
                myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);
            
            self.log("UNFollowing notebook "+ data_values['uri']);
            
            data_values['u'] = self._user;
            data_values['p'] = self._pass;

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("Json invalido su unfollowNotebook .. uh?");
                        return false;
                    }

                    self.closeNotebook(h.html);
                    self.refreshMyDoniBox();
                    self.log("Unfollowed notebook "+ data_values['uri']);

                } // success
            });

        }, // unfollowNotebook()

        deleteNotebook : function(data_values) {
            var self = this,
                myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);
            
            self.log("Deleting notebook "+ data_values['uri']);
            
            data_values['u'] = self._user;
            data_values['p'] = self._pass;

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("Json invalido su DELETENotebook .. uh?");
                        return false;
                    }

                    self.closeNotebook(h.html);
                    self.refreshMyDoniBox();
                    self.log("Deleted notebook "+ data_values['uri']);

                } // success
            });

        }, // deleteNotebook()

        deleteBookmark : function(data_values) {
            var self = this,
                myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);
            
            self.log("Deleting bookmark "+ data_values['uri'] + " from notebook "+ data_values['nb_uri']);
            
            data_values['u'] = self._user;
            data_values['p'] = self._pass;

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("Json invalido su DELETEBookmark .. uh?");
                        return false;
                    }

                    self.refreshMyDoniBoxWidgets([data_values['qstring']]);
                    self.refreshNotebookBox(h.html);
                    self.refreshMyDoniBox();

                    self.log("Deleted bookmark "+ data_values['uri']);

                } // success
            });

        }, // deleteBookmark()


        setNotebooks : function (obj) {
            var self = this;
            self.nb = obj;
            self.log('Notebooks in place');
        },

        // Closes a notebook box (if it's open) and refreshes every content box
        // which contains a bookmark from this notebook. closeNotebook is called
        // before setNotebooks so we can still look for it
        closeNotebook : function (uri) {
            var self = this;
            
            self.log("Closing notebook "+uri);
            $('div.box.myDoniNotebook').each(function(e, i) {
                var id = $(this).attr('id');
                if (self.options.boxView.getResIdFromId(id) == "b_"+uri)
                    self.options.boxView.removeBox(id);
            });
            self.options.boxView.resize();

            self.refreshMyDoniBoxWidgetsFromNotebook(uri);

        }, // closeNotebook

        // Will call refreshMyDoniBoxWidgets() on every box which contain the
        // given notebook's bookmarks
        refreshMyDoniBoxWidgetsFromNotebook : function (uri) {
            var self = this,
                nb = null,
                qstrings = [];
            
            self.log("Refreshing widgets from NB " + uri);
            
            // Get the notebook
            for (i in self.nb) 
                if (self.nb[i].uri == uri)
                    nb = self.nb[i];

            // Get its qstrings and unique them, base64 them so we can pass it to
            // refreshMyDoniBoxWidgets
            if (nb) {

                // Refresh myDoni widgets inside content boxes
                for (i in nb.bookmarks)
                    if ($.inArray(nb.bookmarks[i].qstring, qstrings) == -1) 
                        qstrings.push($.base64Encode(nb.bookmarks[i].qstring));

                self.refreshMyDoniBoxWidgets(qstrings);
            }
            
        }, // refreshMyDoniBoxWidgetsFromNotebook()

        refreshNotebookBox : function (uri) {
            var self = this;
            self.log("Refreshing NotebookBox "+uri);
            
            // Refresh Notebook box, if there's any: close and open it again
            $('div.box.myDoniNotebook').each(function (i, e) {
                
                var id = $(this).attr('id'),
                    local_uri = self.options.boxView.getResIdFromId(id);

                if ("b_"+uri == local_uri) {
                    var data_values = {};
                    data_values['u'] = self._user;
                    data_values['p'] = self._pass;
                    data_values['method'] = 'myDoniGetNotebook';
                    data_values['resource'] = $.base64Encode(uri);
                    _loadAuthResource(data_values);
                    self.options.boxView.removeBox(id);
                    self.options.boxView.resize();
                }
            });
        }, // refreshNotebookBox()

        // Refreshes the content of all myDoni widgets inside boxes. This is called after
        // a login, a new subscription, a new bookmark creation and so on.. IF an array of
        // qstrings is passed, will refresh only boxes with those qstrings (b64 encoded)
        refreshMyDoniBoxWidgets: function(qstrings) {
            var self = this;
            
            self.log("Refreshing box Widgets for "+qstrings);
            
            $('div.box.transcription, div.box.facsimile, div.box.imageInfo').each(function (e,i) {
                var id = $(this).attr('id');
            
                // If there's qstrings, refresh only those boxes
                if (typeof(qstrings) == 'object') 
                    if ($.inArray(self.boxes[id].qstring, qstrings) == -1) 
                        return;
                
                self.getMyDoniWidgetFromBoxId(id);
            });
            
        }, // refreshMyDoniBoxWidgets()

        _updateBM : function (data) {
            var self = this;
            for (var i = data.length - 1; i >= 0; i--) {
                var bm = {}, 
                    o = data[i];
                if (o.qstring != null) {
                    self.log("Pushing new BM: " + o.qstring);
                    self.bm.push(o);
                } else {
                    self.log("Ouch, null qstring for bookmark " + o.uri+ " (title: "+o.title+")");
                }
            }
        }, // _updateBM()

        // Adds the bookmark buttons to the dom, if an id is specified, adds the buttons
        // only to that box
        addButtons : function(id) {
            var self = this,
                bmtool = $('#'+id+" p.bookmarkTool");

            if (bmtool.length > 0) {
                self.log(id+ " ha gia' il bottone per i bookmark");
            } else {
                var el = (id === undefined) ? $('div.boxHeaderTools p.removeTool') : $('#'+id+" p.removeTool");
                el.before("<p class='boxTool bookmarkTool'>BB</p>");
                self.log("Added buttons to "+id);
            }

            self.refreshBookmarkToolButtonFromId(id);

        }, // addButtons()

        refreshBookmarkToolButtonFromId : function (id) {
            var self = this,
                bmtool = $('#'+id+" p.bookmarkTool");

            bmtool.removeClass('bookmark_button_mine bookmark_button_others bookmark_button_none');

            var qstring = $.base64Decode(self.boxes[id].qstring),
                flag = false;

            self.log("Refreshing bookmark tool button from id "+id);

            for (i in self.nb) {
                var nb = self.nb[i];
                for (j in nb.bookmarks) {
                    var bm = nb.bookmarks[j];
                    if (bm.qstring == qstring) {
                        if (nb.own_nb) {
                            bmtool.addClass('bookmark_button_mine')
                        } else {

                            bmtool.addClass('bookmark_button_others')
                        }
                        flag = true;
                    } // bm.qstring == qstring
                } // for j
            } // for i

            if (!flag) 
                bmtool.addClass('bookmark_button_none');

        }, // refreshBookmarkToolButtonFromId()

        refreshBookmarkToolButtons : function () {
            var self = this;
            $('div.box.transcription, div.box.facsimile, div.box.imageInfo').each(function (e,i) {
                 self.refreshBookmarkToolButtonFromId($(this).attr('id'));
            });
        },

        // Adds a box to the internal structures, adds buttons if needed
        addBox : function(qstring, id, title, resourceType, resourceTypeString) {
            var self = this;
            
            self.log("AddBox: "+qstring+", "+id+", "+title+", "+resourceType+", "+resourceTypeString+".");

            // Init the autocomplete if it's the myDoni box
            if (resourceType == "myDoni") 
                self.initNBAutocomplete();

            // Dont add useless boxes (introduction, bookmarks, ..)
            if (resourceType != "transcription" && resourceType != "facsimile" && resourceType != "imageInfo")
                return false;

            // Sanitize the query string to strip off type and other highlight thingies
            qstring = $.base64Encode(self.sanitizeQString(qstring));
            self.boxes[id] = {qstring: qstring, title: title, resourceType: resourceType, resourceTypeString: resourceTypeString};
            self.addButtons(id);

            if (self.loggedIn()) 
                self.getMyDoniWidgetFromBoxId(id);

            return; 
            
        }, // addBox()
        
        getMyDoniWidgetFromBoxId : function (id) {
            var self = this,
                data_values = {};
                
            data_values['method'] = 'myDoniGetMyDoniWidget';
            data_values['u'] = self._user;
            data_values['p'] = self._pass;
            data_values['qstring'] = self.boxes[id].qstring;

            self.options.boxView.setLoading(id, true);

            self.log("Asking for box content " + data_values['qstring']);

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate?? why o why ", data);
                        return false;
                    }
                    self._replaceMyDoniWidget(id, h.html);

                } // success
            });
            
        }, // getMyDoniWidgetFromBoxId()

        // replaces the box with the given id myDoni widget counting animations, 
        // first time or whatever it's needed
        _replaceMyDoniWidget : function(id, html) {
            var self = this, 
                replacing = $('#'+id+ " div.widget.myDoni").length > 0; 

            if (myPrefs.get('animations') && replacing) {
                $('#'+id+ " .boxContent div.widget.myDoni").slideUp(myPrefs.get('animationsLength'), function () {
                    $('#'+id+ " .boxContent div.widget.myDoni").addClass('remove_me').removeClass('myDoni');
                    $('#'+id+ " .boxContent").prepend(html);
                    $('#'+id+ " .boxContent div.widget.myDoni").hide().slideDown(myPrefs.get('animationsLength'));
                    self.options.boxView.setLoading(id, false);
                });
        	} else if (myPrefs.get('animations') && !replacing) {
                $('#'+id+ " .boxContent").prepend(html);
                $('#'+id+ " .boxContent div.widget.myDoni").hide().slideDown(myPrefs.get('animationsLength'));
                self.options.boxView.setLoading(id, false);
        	} else {
                $('#'+id+ " .boxContent div.widget.myDoni").detach();
                $('#'+id+ " .boxContent").prepend(html);
                self.options.boxView.setLoading(id, false);
        	}
        }, // _replaceMyDoniWidget
                                
        save_notebook : function (button) {
            var self = this,
                parent = $(button).parents('div.newnb_form'),
                // Notebook's data
                uri = parent.find('.nb_uri').val(),
                nb_title = parent.find('.nb_title').val(),
                nb_note = parent.find('.nb_note').val(),
                nb_public = parent.find('.nb_public').is(":checked"),
                error = false;

            // Dumb validation
            parent.find('li').removeClass('validation_error');
            if (nb_title == "") {
                parent.find('.nb_title').parents('li').addClass('validation_error');
                error = true;
            }
            if (nb_note == "") {
                parent.find('.nb_note').parents('li').addClass('validation_error');
                error = true;
            }
            if (error) return false;
                
            self.log("Saving a notebook");
            
            var myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);
            
            var params = {notes: nb_note, uri: uri, title: nb_title, 'public': nb_public},
                data_values = {u: self._user, p: self._pass, method: 'myDoniSaveNotebook', params: params};

            if ($('#notebookDialog').hasClass('from_bookmark_dialog'))
                $("#notebookDialog").addClass('ignore_clicks');
            else    
                $("#notebookDialog").dialog('close');

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate?? why o why ", data);
                        return false;
                    }

                    $("#notebookDialog").removeClass('ignore_clicks').removeClass('from_bookmark_dialog').dialog('close');

                    self.addNotebookToSelect(h.html, nb_title);
                    self.refreshMyDoniBox();
                    self.refreshMyDoniBoxWidgetsFromNotebook(h.html);
                    self.refreshNotebookBox(h.html);

                } // success
            });
            
        }, // save_notebook() 

        addNotebookToSelect : function (uri, title) {
            var s = $('#bookmarkDialog .bm_nb_select').each(function(e, i) {
                $(this).append('<option value="'+uri+'">'+title+"</option>");
                $(this)[0].selectedIndex = $(this)[0].length - 1;
            });
        },
                
        // Saves the content of the bookmar dialog. Button is the html button which 
        // was pressed by the user
        save_bookmark : function (button) {
            
            var self = this,
                parent = $(button).parents('div.newbm_form,div.editbm_form'),
                // Bookmark's data
                qstring = parent.find('input.bm_qstring').val(),
                title = parent.find('input.bm_title').val(),
                note = parent.find('.bm_note').val(),
                resourceType = parent.find('.bm_resource_type').val(),
                uri = parent.find('.bm_uri').val(),
                oldnb_uri = parent.find('.bm_oldnb_uri').val(),
                // Notebook's data
                sel_nb = parent.find('.bm_nb_select :selected').val(),
                error = false;
                
            // Dumb validation
            parent.find('li').removeClass('validation_error');
            if (note == "") {
                parent.find('.bm_note').parents('li').addClass('validation_error');
                error = true;
            }
            if (typeof(sel_nb) == 'undefined') {
                parent.find('.bm_nb_select').parents('li').addClass('validation_error');
                error = true;
            }
            if (error) return false;

            self.log("Saving a bookmark, whichever ..");

            var myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);

            var params = {notes: note, uri: uri, title: title, qstring: qstring, resourceType: resourceType, 
                sel_nb: sel_nb, oldnb_uri: oldnb_uri},
                data_values = {u: self._user, p: self._pass, method: 'myDoniSaveBookmark', params: params};

            $("#bookmarkDialog").dialog('close');

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate?? why o why ", data);
                        return false;
                    }

                    self.log("Bookmark "+ qstring +" saved, yay");

                    self.refreshMyDoniBox();

                    // Pass an array with a single qstring to refresh just the boxes with that qstring
                    self.refreshMyDoniBoxWidgets([$.base64Encode(qstring)]);
                    self.refreshNotebookBox(sel_nb);
                    if (sel_nb != oldnb_uri) self.refreshNotebookBox(oldnb_uri);
                    
                } // success
            });
            
        }, // save_bookmark

        editBookmarks : function(id) {
            var self = this;
            
            if (self._pass == null && self._user == null) {
                displayError("Devi aver fatto il login in MyDoni per poter creare un bookmark.") 
                return false;
            }

            var qstring = self.options.boxView.getQStringFromId(id);

            self.log("Adding/editing bookmarks on box with id "+id+", qstring: "+qstring);

            self.showBookmarkDialogFromBoxId(id);

        }, // editBookmarks()
        
        createNotebook : function () {
            var self = this;
            self.showNotebookDialog();
        },

        editNotebook : function (v) {
            var self = this;
            self.showNotebookDialog(v['uri']);
        },

        showSignupDialog : function () {
            var self = this,
                sigd = $("#signupDialog");

            self.log("# Showing signup dialog");
            var data_values = { method: 'getMyDoniUserSignup' };

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate da showNotebookDialog!!? ", data);
                        return false;
                    }

                    sigd.html(h.html);

                    // Finally open the dialog with its needed initializations
                    sigd.dialog("option", "title", "Registrati adesso");
                    sigd.dialog('open');
                } // success
            });
                
        }, // showSignupDialog()


        save_user : function (button) {
            var self = this,
                parent = $(button).parents('div.signup_form'),
                // User's data
                username = parent.find('.signup_username').val(),
                email = parent.find('.signup_email').val(),
                password = parent.find('.signup_password').val(),
                password_confirmation = parent.find('.signup_password_confirmation').val(),
                errors = [];

            // Dumb validation
            parent.find('li').removeClass('validation_error');
            parent.find(".signup_errors").detach();
            
            if (username == "") {
                parent.find('.signup_username').parents('li').addClass('validation_error');
                errors.push("Devi scegliere uno username");
            }
            if (email == "") {
                parent.find('.signup_email').parents('li').addClass('validation_error');
                errors.push("Inserisci il tuo indirizzo email");
            }
            if (password == "") {
                parent.find('.signup_password').parents('li').addClass('validation_error');
                errors.push("Devi scegliere una password");
            }
            if (password_confirmation == "") {
                parent.find('.signup_password_confirmation').parents('li').addClass('validation_error');
                errors.push("Inserisci di nuovo la password come conferma");
            }
            if (password != password_confirmation) {
                parent.find('.signup_password_confirmation,.signup_password').parents('li').addClass('validation_error');
                errors.push("Le due password inserite non combaciano");
            }
            
            if (errors.length) {
                var s = "";
                for (i in errors)
                    s += "<li>"+errors[i]+"</li>";
                parent.append("<div class='signup_errors'><ul>"+s+"</ul></div>");
                return false;
            }
                
            self.log("Trying to save a new user");
            
            var params = {user : {name: username, email_address: email, password: password, 
                                    password_confirmation: password_confirmation}, page_path: 'users/signup'};
                data_values = {method: 'myDoniSaveNewUser', params: params};
            
            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("Niente json da save_user ?? uhm ...  ", data);
                        return false;
                    } 

                    if (h['data']['signup_error'] == 1) {
                        parent.append("<div class='signup_errors'>"+h.html+"</div>");
                        return false;
                    } else {
                        $('#myDoniUser').val(email);
                        $('#myDoniPassword').val(password);
                        myPrefs.login();
                        $("#signupDialog").dialog('close');
                    }

                } // success
            });
            
        }, // save_user() 


        showNotebookDialog : function (uri) {
            var self = this,
                nbd = $("#notebookDialog");
                
            uri = (typeof(uri) == 'undefined') ? '' : uri;

                self.log("# Showing bm dialog for uri " + uri);
                var data_values = {p: self._pass, u: self._user, method: 'myDoniGetNotebookDialog', uri: uri};

                $.ajax({
                    type: 'POST',
                    url: ajaxApiUrl, 
                    data: data_values, 
                    success: function(data) {

                        var h = {};
                        if (checkJson(data, h, true) == false) {
                            self.log("User e pass sbagliate da showNotebookDialog!!? ", data);
                            return false;
                        }

                        nbd.html(h.html);

                        // Finally open the dialog with its needed initializations
                        nbd.dialog("option", "title", ((uri == '') ? "Crea un nuovo" : "Modifica")+" notebook")
                        nbd.dialog('open');
                    } // success
                });
                
        }, // showNotebookDialog()

        // Opens the bookmark dialog for a box id: with all of it's bookmarks editable
        showBookmarkDialogFromBoxId : function(id) {
            var self = this,
                bmd = $('#bookmarkDialog');
            
            self.log("# Showing bm dialog for id "+id);
        
            var data_values = {p: self._pass, u: self._user, method: 'myDoniGetNewBMDialog', bm: self.boxes[id]};

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate da showBookmarkDialog??! ", data);
                        return false;
                    }

                    bmd.html(h.html);

                    // Finally open the dialog with its needed initializations
                    bmd.dialog("option", "title", self.boxes[id].resourceTypeString +" "+ self.boxes[id].title)
                    bmd.dialog('open');
                    $('.dialog_accordion').accordion({'fillSpace': true});

                } // success
            });
            
        }, // showBookmarkDialogFromBoxId()


        showBookmarkDialogFromUri : function(data_values) {
            var self = this,
                bmd = $('#bookmarkDialog'),
                uri = data_values['uri'];
            
            self.log("# Showing bm dialog for single uri "+uri);
        
            var data_values = {p: self._pass, u: self._user, method: 'myDoniGetBookmarkDialogFromUri', uri: uri};

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: data_values, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate da showBookmarkDialogFromURI??! ", data);
                        return false;
                    }

                    bmd.html(h.html);

                    // Finally open the dialog with its needed initializations
                    bmd.dialog("option", "title", "Modifica bookmark");
                    bmd.dialog('open');
                    $('.dialog_accordion').accordion({'fillSpace': true});

                } // success
            });
            
        }, // showBookmarkDialogFromUri()

        
        refreshMyDoniBox : function(callback) {

            var self = this,
                myDoniId = $('div.box.myDoni').attr('id');
            self.options.boxView.setLoading(myDoniId, true);

            $.ajax({
                type: 'POST',
                url: ajaxApiUrl, 
                data: {method: 'myDoniLogin', u: self._user, p: self._pass}, 
                success: function(data) {

                    var h = {};
                    if (checkJson(data, h, true) == false) {
                        self.log("User e pass sbagliate :P");
                        return false;
                    }

                    if (parseInt(h['error']) == 30) {
                        self.log("Error 30 dal json .. ops");
                        return false;
                    }
                    
                    // Set the internal notebooks javascript structures
                    self.setNotebooks(h['data']['notebooks']);
                    self.setMyDoniBox(h['data']['my_doni_html']);

                    self.options.boxView.setLoading(myDoniId, false);
                    
                    if (typeof(callback) == 'function') 
                        callback.apply(this);
                    
                } // success
            });
        }, // refreshMyDoniBox()

        setMyDoniBox: function (html) {
            var self = this,
                boxId = $("div.box.myDoni").attr('id');

            $("#"+boxId+" .boxContent").html(html);
            self.initNBAutocomplete();

            self.refreshBookmarkToolButtons();

            self.log("SetMyDoniBox: done");

        }, // setMyDoniBox()

        
        initNBAutocomplete : function() {
            var self = this;
            
            // Enable the add notebook autocomplete
            $('input.my_doni_notebook_title').autocomplete({
                source: ajaxApiUrl+"?method=myDoniAutocompleteNotebookTitle&p="+self._pass+"&u="+self._user,
    			minLength: 2,
    			select: function(event, o) {
                    self.followNotebook(o, $(this).val());
    			}
            });
        }, // initNBAutocomplete()

        isBookmarked : function(qstring) {
            var self = this;
            for (var j = self.nb.length - 1; j >= 0; j--)
                for (var i = self.nb[j].bookmarks.length - 1; i >= 0; i--) 
                    if (self.nb[j].bookmarks[i].qstring == qstring)
                        return true;
        }, // isBookmarked()
        
        logout : function () {
            var self = this;
            
            self.setUserPass(null, null);
            self.setMyDoniBox(null);

            // Remove every myDoni box: login and notebooks etc
            $('.box.myDoni, .box.myDoniNotebook').each(function() {
                var id = $(this).attr('id');
                self.options.boxView.removeBox(id);
            });
            self.options.boxView.resize();

            // Remove every myDoni widgets
            if (myPrefs.get('animations'))
                $('div.box div.widget.myDoni').slideUp(myPrefs.get('animationsLength'), function() {
                    $(this).detach();
                })
            else
                $('div.box div.widget.myDoni').detach();
            
        },
        
        // setUserPass? We are logged in!
        setUserPass : function (a, b) {
            this._user = a;
            this._pass = b;            
        },
        
	    log : function(w) {
	        if (this.options.debug == false) return;

            if (typeof console == "undefined") {
                if ($("#debug_foo").attr('id') == null) 
                    $("body").append("<div id='debug_foo' style='position: absolute; right:2px; bottom: 2px; border: 1px solid red; font-size: 10px;'></div>");
                $("#debug_foo").append("<div>BM# "+w+"</div>");
            } else                 
                console.log("BM# "+ w);
	    } // log()
    } // prototype
})($)