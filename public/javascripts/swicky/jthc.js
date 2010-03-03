$(function() { 

    $.jthc = function (opts) {
        // Options for this JTHC object
        this.options = $.extend({}, $.jthc.defaults, opts);
        this.init();
    };

	$.fn.jthc = function(opts) {
		var options = $.extend($.jthc.defaults, opts);
		return this.each(function(){
			new $.jthc(this, options);
		});
	}; // $.fn.jthc()

    $.jthc.defaults = {
        debug: true,
        // URL to do Ajax query to
        baseURL: "/swicky_notebooks/context/",
        // DOM elements IDs 
        containerID: "THCAnnotations",
        tooltipID: "THCTooltip"
    };

    $.jthc.prototype = {
        
        init: function() {
            this.log("## JTHC INIT!");

            // AjaxManager to handle multiple concurrent Ajax request, or, better, to queue
            // them to avoid race conditions
            this.ajaxmanager = $.manageAjax.create('thc', { queue: true, cacheResponse: false, maxRequests: 10 }); 

            /* this.Fragments will contain all the data we got from server, in a structure like:
             { 'xpointer' : 
                    {   'parenturl': 'URL of this page', 
                        'items': [0: {'comment': '...',
                                      'hasAuthor': '...',
                                      ... ecc
                                     },
                                  1: { } ..
                                 ],
                         'properties': { 'comment': {'hash': '..', id: '..', ..},
                                         'hasAuthor': {'hash': '..', ...}, ..
                                       },
                         'types': { 'class': {'hash': '...', id: '..', ..},
                                    'Note': {'hash': '...', id: '..', ..}
                                  }
                      },
                  'xpointer 2': { 'parenturl', 'items', 'properties' ... like above }

              }
             */
             this.fragments = {};
             this.annotationsNumber = 0;
             this.xpointersToLoad = 0;
             this.xpointersLoaded = 0;

             // Get all the uris in this page
             this.uris = THCTag.getContentURIs();
             
             for (var i=0; i<this.uris.length; i++)
                this.askForFragments(this.uris[i]);
            
             // this.askForFragments("http://dbin.org/swickynotes/demo/HanselAndGretel.htm");
            
            // Append to DOM the containers for the annotation browser
            $('body').append("<div id='"+this.options.containerID+"'><h2><span id='annotationsNumber'></span> annotations</h2></div>");
            $('#'+this.options.containerID).addClass('loading');

            // And the lousy tooltip
            $('body').append("<div class='THCAnnotationsBox' id='"+this.options.tooltipID+"' style='border: 1px solid black; position: absolute; display:none;'></div>");
            
            self = this;
            /*
            $('.THCStatementObject,.THCStatementPredicate').live('mouseenter', function() { 
                
                var itemURI = $(this).attr('about'),
                    item = self.getItemFromURI(itemURI);

                // Havent found an item? .. bad bad thing.
                if (!item) {
                    self.log("### Ouch! Didnt find an item with this URI: "+itemURI);
                    return;
                }

                // self.log("## Showing a tooltip for item with URI: " + itemURI);

                // Just list all fields of this object... for now
                var ret = "";
                for (wut in item)
                    ret += wut +": " + item[wut] + "<br>";
                self.showTooltip(this, ret);

            });

            $('.THCStatementSubject,.THCStatementObject,.THCStatementPredicate').live('mouseleave', function() {
                $("#"+self.options.tooltipID).css({display: 'none'});
            });
            */

            $('.THCStatementSubject.Source,.THCStatementObject.Source,').live('click', function() {
                var url = $(this).attr('about');
                if (confirm("Navigate to "+url+"? "))
                    window.location = url;
                return false;
            });

            $('.THCStatementSubject.SourceFragment,.THCStatementObject.SourceFragment,').live('click', function() {
                var uri = $(this).attr('about'),
                    item = self.getItemFromURI(uri),
                    xpointer = self.getXpointerFromURI(uri),
                    xpointerId = item['hasCoordinates'],
                    url = self.getFieldFromId(xpointer, xpointerId, 'uri');
                    
                if (confirm("Navigate to "+url+"? "))
                    window.location = url;
                return false;
            });
            
            $('.THCHighlightButton').live('click', function() {
                var xpointer = $(this).attr('about');
                
                self.log("Highlighto???! " + xpointer);
                THCTag.showByXpointer(xpointer);

            });

            
        }, // init()

        // DEBUG/TODO: temporary crappy tooltip.. replace with something nicer
        showTooltip : function(obj, content) {
            var tip = $("#"+this.options.tooltipID),
                objPos = $(obj).offset(),
                tipLeft = objPos.left + 20,
                tipTop = objPos.top + $(obj).height() + 20;
                
            tip.html(content);
            tipLeft -= tip.width()/2;

            // this.log("## Showing tooltip with content: "+content);
            tip.css({left: tipLeft +'px', top: tipTop + 'px', display: 'block'});
            
        }, // showTooltip()
        
        
        // Gets the fragments (xpointers) associated to the given URI, storing
        // them into the this.fragments[] array
        askForFragments : function (uri) {
            var self = this;
            self.log("## Getting fragments for: "+uri);

            self.ajaxmanager.add({
                url: this.options.baseURL + "annotated_fragments",
                data: { uri: uri },
                dataType: 'json',
                type: 'POST',
                success: function(data) { 
                    self.log("## Got "+data.length+" new fragments for: "+uri);

                    var n = data.length;
                    
                    if (n) {

                        for (var i=0; i<n; i++) {
                            var xp = data[i];
                            self.fragments[xp] = {'parenturl': uri};
                            self.log("## Created xpointer section: '"+xp+"' for "+uri);
                        }
                        
                        self.askForXPointers();

                    } else {
                        self.log("## No fragments associated to "+uri);
                    }
                        
                },
                error: function(req, status, err) { self.log("Error... "+req+" : "+status+" : "+err); }
            });
            
        }, // askForFragments()
        
        
        // Gets the xpointers associated to the saved fragments
        askForXPointers : function () {

            var self = this;

            if (self.fragments == {}) {
                self.log("## No fragments to load xpointers for ..");
                return;
            }

            // Cycle over all URIs, then over all fragments for the given URI
            for (xpointer in self.fragments) {

                // DEBUG TODO: Add a "done" field to avoid duplicate requests?
                // and to display a progress bar or something.
                // TODO: when we're done, 

                self.log("#### Checking out xpointer " + xpointer);

                self.xpointersToLoad++;

                $.ajax({
                    url: this.options.baseURL + "annotations",
                    data: { xpointer: xpointer },
                    dataType: 'json',
                    type: 'POST',
                    success: function(data, text, xmlhr) {
                        

                        var n = data.items.length,
                            xpointer = data['annotation-for']['uri'],
                            hash = data['annotation-for']['hash'];
                            
                        if (n == 0) {
                            self.log("## No annotation for an xpointer... "+xpointer+" ?? ");
                            return;
                        }

                        self.xpointersLoaded++;
                        
                        self.log("## Got "+n+" new items for xpointer "+hash+" / "+xpointer);
                        self.log("## Loaded "+self.xpointersLoaded+" out of "+self.xpointersToLoad+" xpointers");

                        self.addItemsToXPointer(xpointer, data);
                        self.addNotesForXpointer(xpointer);

                        self.log("## Note shown, putting buttonz! ");
                        THCTag.addByXPointer(xpointer);

                        if (self.xpointersToLoad == self.xpointersLoaded) {
                            $('#'+self.options.containerID).removeClass('loading');
                            self.setTipContent();
                        }

                    },
                    error: function(req, status, err) { 
                        self.log("Error... "+req+" : "+status+" : "+err); 
                        self.xpointersLoaded++;
                    }
                }); // $.ajax
            } // for uri
            
        }, // askForXpointers()
        

        addItemsToXPointer : function (xpointer, data) {
            var self = this,
                fragment = self.fragments[xpointer];
            
            if (typeof self.fragments[xpointer] == "undefined") {
                self.log("### ERROR! Section for xpointer not defined??! " + xpointer);
            }

            // self.log("### Adding items to xpointer "+ xpointer);

            fragment.items = data.items;
            fragment.hash = data['annotation-for']['hash'];
            
            // TODO DEBUG: do we need types and properties?
            fragment.types = data.types;
            fragment.properties = data.properties;
            
        },
        
        // Returns an object with two fields, one for URL part, the other
        // for the path
        splitUrlXpointer : function (urlxpointer) {
            var xp = urlxpointer.split('#');
            return {url: xp[0], path: xp[1]};
        },
        
        
        addNotesForXpointer : function (xpointer) {
            var self = this, fragment = self.fragments[xpointer];

            if (typeof fragment == 'undefined') {
                self.log("### ERROR: No annotations for "+xpointer);
                return;
            }

            self.log("## Displaying fragment with "+fragment.items.length+" items");
            
            var items = fragment.items;
    
            // TODO DEBUG: bisogna cercare in types com'e' l'id del type Note, ed usare
            // quello per cercare le note.. non una stringa fissa "Note" ..

            for (var i=0; i<items.length; i++) {
                if (self.isItemOfType(items[i], "Note")) {
                        self.addNoteToAnnotationBox(xpointer, items[i].id);
                } else {
                    // self.log(i+" is not a Note: "+items[i].type);
                }
            } // for

        }, // addNotesForXpointer()


        increaseAnnotationsNumber : function () {
            var self = this;

            self.annotationsNumber++;
            $("#"+this.options.containerID+" span#annotationsNumber").html(self.annotationsNumber);

            return;
        },

        addNoteToAnnotationBox: function (xpointer, id) {
            
            var self = this, 
                note = self.getItemFromXI(xpointer, id),
                hash = self.getHashFromXpointer(xpointer);
                
            self.increaseAnnotationsNumber();
            
            self.log("## addNote for "+id);
            
            var cont = $("#"+this.options.containerID);
            var markup = 
                '<div id="'+hash+'-note" class="THCNoteItem collapsed" about="'+xpointer+'">'+
                "<h3>"+note.label+"</h3>"+
                "<span class='swicky_hidden'>comment: "+note.comment+"</span>"+
                "<span class='swicky_hidden'>hasCreationDate: "+note.hasCreationDate+"</span>"+
                "<span class='swicky_hidden'>hasNoteAuthor: "+note.hasNoteAuthor+"</span>";

            // Markup for each statement
            markup += this.getStatementsMarkup(xpointer, note);

            // Button to highlight the html - TODO DEBUG: on mouseover?
            // markup += '<span class="THCHighlightButton" about="'+xpointer+'">Highlight annotation in the text!</span>';
            // markup += "</div>";

            cont.append(markup);

            self.bindLiveHandlers(xpointer);

        }, // addNoteToAnnotationBox()


        setTipContent : function () {
            var self = this;

            $('table.THCStatementTable span').each(function(i, obj) {

                var uri = $(obj).attr('about'),
                    item = self.getItemFromURI(uri);

                var ret = "";
                for (wut in item)
                    ret += wut +": " + item[wut] + "<br>";
    
                myEztip.setContent(obj, ret);
                
            });
            
        },


        bindLiveHandlers : function (xpointer) {
            var self = this, 
                hash = self.getHashFromXpointer(xpointer),
                selectId = hash,
                deselectId = hash+"-desel";
                
            $("a#" + selectId + ", div.THCNoteItem.collapsed").live("click", function() {
                var xp = $(this).attr('about');
                THCTag.showByXPointer(xp);
                self.showNote(xp);
                return false;
            });

            $("a#" + deselectId).live("click", function() {
                var xp = $(this).attr('about');
                THCTagCore.Annotate.deselectFragment(); 
                self.hideNote(xp);
                return false;
            });

            
        },

        isItemOfType : function (item, type) {
            // TODO DEBUG: sanity check on the item object
            // reverse the for cycle

            // No type? For sure it's false!
            if (typeof item['type'] == 'undefined')
                return false;

            for (var i=0; i<item['type'].length; i++)
                if (item['type'][i] == type)
                    return true;
            return false;
        },


        // Returns an item (object with items, properties, etc) from url
        // xpointer and item id. Returns false if it doesnt exist
        getItemFromXI : function (xpointer, id) {
            var self = this, fragment = self.fragments[xpointer];

            if (typeof fragment == "undefined") {
                self.log("### GetItemFromXI ERROR: didnt find note with id "+id+" and xpointer "+xpointer);
                return false;
            }

            for (var i=0; i<fragment.items.length; i++)
                if (fragment.items[i].id == id) 
                    return fragment.items[i];

            return false;
        },
        
        // Will cycle over every fragment to look for the item with the given URI
        getItemFromURI : function (uri) {
            var self = this;

            var xpointer;
            for (xpointer in self.fragments) {
                var fragment = self.fragments[xpointer];
                if (typeof fragment.items != "undefined")
                    for (var i=0; i<fragment.items.length; i++)
                        if (fragment.items[i].uri == uri) 
                            return fragment.items[i];

            } // for index
            return false;
        },

        // Returns the content of the given field of an item object
        getFieldFromId : function (xpointer, id, field) {
            var self = this, item;
            if (item = self.getItemFromXI(xpointer, id))
                return item[field];
            return false;
        },

        // Useful (?) shortcuts
        getLabelFromId : function (x, i) { return this.getFieldFromId(x, i, 'label'); },
        getUriFromId : function (x, i) { return this.getFieldFromId(x, i, 'uri'); },

        getHashFromXpointer : function (xpointer) {
            var self = this,    
                fragment = self.fragments[xpointer];
            
            if (typeof fragment == "undefined") {
                self.log("ERROR: getHashFromXpointer with wrong xpointer: "+xpointer);
                return "ERROR: no such xpointer: "+xpointer;
            }

            // self.log("## Asked for HASH by xpointer "+xpointer+", returning "+fragment['hash']);
                
            return fragment['hash'];
            
        }, // getHashFromXpointer

        getXpointerFromHash : function (hash) {
            var self = this;

            
            for (i in self.fragments) 
                if (self.fragments[i]['hash'] == hash) {
                    self.log("## Asked for xpointer from hash: "+hash+", returning "+ i);
                    return i;
                }

            self.log("ERROR getXpointerFromHash with wrong hash: "+hash+", returning "+ i);
            return "ERROR: NO SUCH HASH "+hash;
                
        },
        
        // Will cycle over every fragment to look for the item with the given URI
        getXpointerFromURI : function (uri) {
            var self = this;

            var xpointer;
            for (xpointer in self.fragments) {
                var fragment = self.fragments[xpointer];
                if (typeof fragment.items != "undefined")
                    for (var i=0; i<fragment.items.length; i++)
                        if (fragment.items[i].uri == uri) 
                            return xpointer;
            } // for index
            return "ERROR: No xpointer for uri "+uri;
        },
        
        // Will return the markup for every statement of the given item
        getStatementsMarkup : function (xpointer, item) {
            var markup = "<table class='THCStatementTable swicky_hidden'>";
            
            // No statements for this Note item .... strange?
            if (typeof item.hasStatement == "undefined") {
                self.log("## Note item without hasStatement? " + item.id)
                return "";
            } 
                
            // TODO DEBUG ... hasStatement in verita' va' pescato partendo dall'URI.. 
            
            // If it's a string, there's a single statement.. otherwise
            // it's an array of statements
            if (typeof item.hasStatement == "string")
                markup += this.getSingleStatementMarkup(xpointer, item.hasStatement);
            else
                for (var i=0; i<item.hasStatement.length; i++)
                    markup += this.getSingleStatementMarkup(xpointer, item.hasStatement[i]);

            markup += "</table>";
            
            return markup;
        }, // getStatementsMarkup()

        // Returns the markup for a single statement
        getSingleStatementMarkup : function (xpointer, statementId) {

            var self = this,
                statement = self.getItemFromXI(xpointer, statementId),
                ret = "";

            self.log("## get single statement markup " + statementId);

            if (statement == false)
                ret = "Cant find the statement "+statementId+" :(";
            else {

                var spanClasses = "THCStatementSubject "+self.getSpanClasses(xpointer, statement.subject);
                ret += 
                    "<td><span class='"+ spanClasses +"' about='"+self.getUriFromId(xpointer, statement.subject)+"'>"+
                    self.getLabelFromId(xpointer, statement.subject)+"</span></td>";

                spanClasses = "THCStatementPredicate "+self.getSpanClasses(xpointer, statement.predicate);
                ret += 
                    "<td><span class='"+ spanClasses +"' about='"+self.getUriFromId(xpointer, statement.predicate)+"'>"+
                    self.getLabelFromId(xpointer, statement.predicate)+"</span></td>";

                spanClasses = "THCStatementObject "+self.getSpanClasses(xpointer, statement.object);
                ret += 
                    "<td><span class='"+ spanClasses +"' about='"+self.getUriFromId(xpointer, statement.object)+"'>"+
                    self.getLabelFromId(xpointer, statement.object)+"</span></td>";
            }

            self.log("### Showing single statement: " + statementId+ " :: "+statement.subject);

            return "<tr class='THCStatement'>"+ret+"</tr>";

            // return "<span class='THCStatement'>"+ret+"</span>";
            
        }, // getSingleStatementMarkup()

        
        getSpanClasses : function (xpointer, id) {
            var self = this,
                item = self.getItemFromXI(xpointer, id);
            
            
            if (self.isItemOfType(item, 'SourceFragment')) {
                self.log("## Returning SOURCEFRAGMENT Span Classes for "+id);
                return "SourceFragment";
            }
                
            if (self.isItemOfType(item, 'Source')) {
                self.log("## Returning SOURCE Span Classes for "+id);
                return "Source";
            }

            self.log("## Returning empty Span Classes for "+id);
                
            return "";
                
        },
        
        
        showNote : function (xpointer) {
            var self = this,
                hash = self.getHashFromXpointer(xpointer),
                noteDivId = hash+"-note";

            self.hideAllNotes();
            $('div#THCAnnotations div#' + noteDivId).removeClass('collapsed').addClass('expanded');
            self.log("## Show note "+xpointer);
            return;
        },
        
        hideNote : function (xpointer) {
            var self = this,
                hash = self.getHashFromXpointer(xpointer),
                noteDivId = hash+"-note";
            self.log("## Hide note "+xpointer);
            $('div#THCAnnotations div#' + noteDivId).addClass('collapsed').removeClass('expanded');
            return;
        },

        hideAllNotes : function () {
            var self = this;
            for (i in self.fragments) {
                self.log("## Will hide note "+i);
                self.hideNote(i);
            }
            self.log("## Hide ALL NOTES end");
            return;
        },


        log: function(w) {

            if (this.options.debug == "false")
                return;
            
            if (typeof console == "undefined") {
                if ($("#debug_foo").attr('id') == null) 
                    $("body").append("<div id='debug_foo' style='position: absolute; right:2px; bottom: 2px; border: 1px solid red; font-size: 1.1em;'></div>");
                $("#debug_foo").append("<div>"+w+"</div>");
            } else {
                console.log(w);
            }
        } // log
    }; // $.jthc.prototype

});
