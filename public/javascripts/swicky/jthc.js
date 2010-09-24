$(function() { 

    $.jthc = function (opts) {
        // Options for this JTHC object
        this.options = $.extend({}, $.jthc.defaults, opts);
        this.init();
    };

    $.fn.jthc = function(opts) {
        var options = $.extend($.jthc.defaults, opts);
        return this.each(function() {
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
            this.imageFragments = {};
            this.pageFragments = {};
            this.annotationsNumber = 0;
            this.xpointersToLoad = 0;
            this.xpointersLoaded = 0;
            this.addedNotesUris = [];
            this.addedXpointers = [];

            // Get all the THCTag uris in this page
            this.uris = THCTag.getContentURIs();            

            /**/
            for (var i=0; i<this.uris.length; i++) {
                var uri = this.uris[i];
                if (!this.isImage(uri)) 
                    this.askForFragments(uri);
                else 
                    this.askForImageFragments(uri);

            }
            this.askForPageNotes();
            
            self = this;

            /* TODO: no more annotations box 
            // Append to DOM the containers for the annotation browser
            $('body').append("<div id='"+this.options.containerID+"'><h2><span id='annotationsNumber'></span> annotations</h2></div>");
            $('#'+this.options.containerID).addClass('loading').draggable({handle: 'h2:first'}).hide();
            this.repositionNoteContainer();
            */

            /* TODO: no more annotations box 
            // Collapse on double click on the H2, the header of the annotations
            $('#'+this.options.containerID+" h2").live('dblclick', function() {
            var t = $('#'+self.options.containerID);
            if (t.hasClass('collapsed'))
            t.removeClass('collapsed');
            else
            t.addClass('collapsed');
            return false;
            });
            */

            $('.THCStatementSubject.Source,.THCStatementObject.Source,').live('click', function() {
                var uri = $(this).attr('about');
                if (confirm("Navigate to "+url+"? "))
                    window.location = url;
                return false;
            });

            $('.THCStatementSubject.SourceFragment,.THCStatementObject.SourceFragment,').live('click', function() {

                var uri = $(this).attr('about'),
                item = self.getItemFromURI(uri),
                xpointer = self.getXpointerFromURI(uri),
                xpointerId = item['hasCoordinates'],
                newXpointer = self.getFieldFromId(xpointer, xpointerId, 'uri'),
                parentItem = self.getItemFromXI(xpointer, item['isPartOf']),
                url = item['uri'];

                if (self.isOnThisPage(xpointer, item))
                    THCTag.showByXPointer(newXpointer);  
                else
                    if (confirm("Navigate to fragment "+url+"? "))
                        window.location = url;

                return false;
            });
            
            $('.THCHighlightButton').live('click', function() {
                var xpointer = $(this).attr('about');
                
                self.log("Highlighto???! " + xpointer);
                THCTag.showByXpointer(xpointer);

            });

            $('span#load_annotations').live('click', function() {
                if ($(this).hasClass('hide')) {
                    $('div.section.has_notes').removeClass('annotated');
                    $('h3.page_annotations').addClass('hidden');
                    $(this).removeClass('hide');
                    $(this).html("Load them!");
                } else {
                    $('h3.page_annotations').removeClass('hidden');
                    $(this).addClass('hide');
                    $('div.section.has_notes').addClass('annotated');
                    $(this).html("Hide all notes..");
                }
            });

            
        }, // init()

        /**/
        isImage: function(uri) {
            return ($("div[about='"+uri+"']").length && $("div[about='"+uri+"']").hasClass("ImageFragment"))
        },

        /**/
        askForImageFragments: function(uri) {
            self = this;
            self.ajaxmanager.add({
                url: this.options.baseURL + "image_fragments",
                data: {uri: uri},
                dataType: 'json',
                type: 'POST',
                success: function(data) {
                    self.imageFragments[uri] = data
                },
                error: function(req, status, err) {}
            });
        },

        // DEBUG/TODO: temporary crappy tooltip.. replace with something nicer
        // TODO: useless from integration with EZTIP?
        /*
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
        */
        
        /* TODO: there's no such thing as note container!! 
           repositionNoteContainer : function () {
           var bw = $('body').width(),
           cw = $('#'+this.options.containerID).width(),
           pos = bw - cw - 10;
           
           $('#'+this.options.containerID).css({left: pos+'px'});
           },
        */
        
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
                    if (data) {
                        // TODO: sanity checks on length? 
                        self.log("## Got "+data.length+" new fragments for: "+uri);

                        var n = data.length;
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


        askForPageNotes : function () {

            // self.pageFragments.push(document.location.href);
            var href = document.location.href;
            self.xpointersToLoad++;

            $.ajax({
                url: this.options.baseURL + "annotations",
                data: { uri: href },
                dataType: 'json',
                type: 'POST',
                success: function(data, text, xmlhr) {

                    var n = data.items.length,
                    xpointer = data['annotation-for']['uri'],
                    hash = data['annotation-for']['hash'];
                    
                    if (n == 0) {
                        self.log("## No annotation for the page "+href+" ?? ");
                        return;
                    }

                    self.xpointersLoaded++;
                    
                    self.log("## Got "+n+" new items for this page "+hash+" / "+href);
                    self.log("## Loaded "+self.xpointersLoaded+" out of "+self.xpointersToLoad+" xpointers");

                    self.fragments[href] = {};3
                    self.addItemsToXPointer(href, data);
                    self.addNotesForXpointer(href);
                    self.setTipContent();
                    // $('#'+self.options.containerID).show();

                    if (self.xpointersToLoad == self.xpointersLoaded) {
                        $('#'+self.options.containerID).removeClass('loading');
                    }

                },
                error: function(req, status, err) { 
                    self.log("Error... "+req+" : "+status+" : "+err); 
                    self.xpointersLoaded++;
                }
            }); // $.ajax
            
        }, // askForPageNotes
        
        
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
                        $('#'+self.options.containerID).show();
                        self.setTipContent();

                        if (self.xpointersToLoad == self.xpointersLoaded) {
                            $('#'+self.options.containerID).removeClass('loading');
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

            fragment.items = data.items;
            fragment.hash = data['annotation-for']['hash'];
            
            // TODO DEBUG: do we need types and properties?
            fragment.types = data.types;
            fragment.properties = data.properties;
            
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
            for (var k=0; k<items.length; k++) {
                if (self.isItemOfType(items[k], "Note")) {

                    var id = items[k]['isAssociatedWith'],
                    associatedSourceFragment = self.getAssociatedSourceFragment(xpointer, items[k]),
                    associatedXpointer = self.getAssociatedXpointer(xpointer, items[k]);

                    if (xpointer == window.location.href) {
                        self.log("### This is a page note, showing in some other strange way? ");
    
                    } else if (!self.isOnThisPage(xpointer, associatedSourceFragment)) {
                        self.log("@@ Hey, this note is not internal! :( ... using original xpointer!")
                        associatedXpointer = xpointer;
                    }

                    fragment.associatedXpointer = associatedXpointer;

                    if (xpointer != associatedXpointer) {
                        self.log("## DIFFERENT ASSOCIATED XPOINTER : " + associatedXpointer + " > "+ xpointer);
                        associatedXpointer = xpointer;
                    }
                    
                    if ($.inArray(items[k].uri, self.addedNotesUris) == -1) {
                        self.addNoteToAnnotationBox(xpointer, items[k].id, associatedXpointer);
                        // TODO: no more reposition of note containers ... 
                        // self.repositionNoteContainer();
                        self.addedNotesUris.push(items[k].uri);

                    } else {
                        self.log("### Already added this note, skipping it: "+ items[k].label);
                    }

                    if ($.inArray(associatedXpointer, self.addedXpointers) > -1)
                        self.log("## Xpointer already added????!? "+ associatedXpointer);
                    else {
                        self.log("## Adding by xpointer: "+ associatedXpointer);
                        if (associatedXpointer != window.location.href) 
                            THCTag.addByXPointer(associatedXpointer);
                        self.addedXpointers.push(associatedXpointer);
                        self.bindLiveHandlers(associatedXpointer);
                    }

                } else {
                    // self.log(k+" is not a Note: ", items[k]);
                }
            } // for

        }, // addNotesForXpointer()


        isOnThisPage : function (xpointer, sourceFragmentItem) {
            var self = this,
            arr = [];

            // If it's not an array... make it an array!
            if (typeof(sourceFragmentItem['isPartOf']) == "string")
                arr.push(sourceFragmentItem['isPartOf']);
            else
                arr = sourceFragmentItem['isPartOf'];

            // SourceFragment: let's check if there's a THCTag which matches his URI
            // The thctags are in this.uris, initialized in init()
            if (self.isItemOfType(sourceFragmentItem, 'SourceFragment')) {
                
                for (var j in arr) {
                    var id = arr[j],
                    uri = self.getFieldFromId(xpointer, id, 'uri');
                    
                    if ($.inArray(uri, self.uris) > -1) 
                        return true;
                }
                
            } else if (self.isItemOfType(sourceFragmentItem, 'Source')) {
                for (j in arr) 
                    if ($('body').attr('about') == self.getFieldFromId(xpointer, sourceFragmentItem['isPartOf'][j], 'uri'))
                        return true;
            }
            
            return false;
            
        },
        

        // Given an item it will take the isAssociatedWith id, take the item with that
        // id and return it
        getAssociatedSourceFragment : function (xpointer, item) {

            // TODO: some sanity checks if some of these getItem fails .. ? 
            var self = this, associatedItem;

            if (associatedItem = self.getItemFromXI(xpointer, item['isAssociatedWith'])) {
                self.log("### getting associated item with "+ item.label + " which is " + associatedItem.label);
                return associatedItem;
            }
            return false;
        },

        // TODO : a bit of redundancy here ? 

        // Given an item it will take the isAssociatedWith id, take the item with that
        // id and return the hasCoordinate xpointer
        getAssociatedXpointer : function (xpointer, item) {

            // TODO: some sanity checks if some of these getItem fails .. ? 
            var self = this, associatedItem, xpointerItem;

            if (associatedItem = self.getItemFromXI(xpointer, item['isAssociatedWith'])) 
                if (xpointerItem = self.getItemFromXI(xpointer, associatedItem['hasCoordinates'])) 
                    return xpointerItem['uri'];
            
            return false;
        },

        increaseAnnotationsNumber : function () {
            var self = this;

            self.annotationsNumber++;
            if (self.annotationsNumber == 1) {
                $("body").append("<div id='annotations_dialog'>There's <span id='annotations_number'>1</span> annotations on this page!"+
                                 "<span id='load_annotations'>Show them!</span></div>");
            } else {
                $("span#annotations_number").html(self.annotationsNumber);
            }

            return;
        },

        addNoteToAnnotationBox: function (xpointer, id, associatedXpointer) {
            
            var self = this, 
            note = self.getItemFromXI(xpointer, id),
            hash = self.getHashFromXpointer(associatedXpointer),
            parentTHCTag = self.getParentTHCTagFromXpointer(associatedXpointer); 

            if (typeof(parentTHCTag) == 'undefined' && xpointer == window.location.href) {
                parentTHCTag = xpointer;
                if ($('div [about="'+parentTHCTag+'"]').length == 0)
                    $('div#contents h3:first').before('<h3 class="toggle page_annotations hidden">Annotations on the entire page</h3><div class="section page_annotations">'+
                                            '<div class="section_header"></div><div class="section_content_container"><div class="section_content">'+
                                            '<div about="'+parentTHCTag+'"></div>'+
                                            '</div><div class="section_notes"></div></div><div class="section_footer"></div></div>');

            }
            
            self.increaseAnnotationsNumber();
            self.log("## addNote for "+id+", parent THCTag is about " + parentTHCTag);
            
            var markup = 
                '<div id="'+hash+'-note" class="THCNoteItem collapsed" about="'+associatedXpointer+'">'+
                "<h3>"+note.label+"</h3>"+
                "<span class='swicky_hidden'><span class='swicky_field_name'>Comment:</span> "+note.comment+"</span>"+
                "<span class='swicky_hidden'><span class='swicky_field_name'>Creation Date:</span> "+note.hasCreationDate+"</span>"+
                "<span class='swicky_hidden'><span class='swicky_field_name'>Note Author:</span> "+note.hasNoteAuthor+"</span>";

            // Markup for each statement
            markup += this.getStatementsMarkup(xpointer, note);
            
            // Button to highlight the html - TODO DEBUG: on mouseover?
            // markup += '<span class="THCHighlightButton" about="'+xpointer+'">Highlight annotation in the text!</span>';
            // markup += "</div>";

            // var cont = $("#"+self.options.containerID);
            // cont.append(markup);

            var new_cont = $('div [about="'+parentTHCTag+'"]').parents('div.section');
            new_cont.addClass('has_notes');
            new_cont.find('div.section_notes').append(markup);

        }, // addNoteToAnnotationBox()


        setTipContent : function () {
            var self = this;

            $('table.THCStatementTable span').each(function(i, obj) {

                var uri = $(obj).attr('about'),
                item = self.getItemFromURI(uri);

                var ret = "";
                for (wut in item)
                    ret += "<span class='swicky_tooltip_entry'><span class='swicky_tooltip_field_name'>" + wut +":</span> " + item[wut] + "</span>";
                
                myEztip.setContent(obj, ret);
            });
            
        },


        // Binds handlers for click events on the note items and on the icons in the
        // text (rdf/cross symbols): this will highlight/de-highlight the referred fragment
        bindLiveHandlers : function (xpointer) {
            var self = this, 
            hash = self.getHashFromXpointer(xpointer),
            selectId = hash,
            deselectId = hash+"-desel";
            
            $("a#" + selectId + ", div.THCNoteItem.collapsed").live("click", function() {
                var xp = $(this).attr('about');
                self.log("Clicked on "+selectId+" !! "+xp)
                self.showNote(xp);
                if (xp != window.location.href)
                    THCTag.showByXPointer(xp);
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

        getParentTHCTagFromXpointer : function (xpointer) {
            var self = this;    
            for (var xp in self.fragments) {
                var fragment = self.fragments[xp];
                if (typeof fragment.items != "undefined")
                    for (var i=0; i<fragment.items.length; i++)
                        if (fragment.items[i].uri == xpointer) 
                            return fragment.parenturl;
            }
        },

        getHashFromXpointer : function (xpointer) {
            var self = this;    
            // fragment = self.fragments[xpointer];

            for (var xp in self.fragments) {
                var fragment = self.fragments[xp];
                if (typeof fragment.items != "undefined")
                    for (var i=0; i<fragment.items.length; i++)
                        if (fragment.items[i].uri == xpointer) 
                            return fragment.items[i]['hash'];
            } // for index

            return false;

            /*
              if (typeof fragment == "undefined") {
              self.log("ERROR: getHashFromXpointer with wrong xpointer: "+xpointer);
              return "ERROR: no such xpointer: "+xpointer;
              }
              
              console.log("Asked for hash, found this fragment: ", fragment);

              if (typeof fragment['hash'] == "undefined") {
              console.log("UNDEFINED?!");
              }

              // self.log("## Asked for HASH by xpointer "+xpointer+", returning "+fragment['hash']);
              
              return fragment['hash'];
            */
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

        // Will cycle over every fragment to look for the item with the given URI
        getAssociatedXpointerFromURI : function (uri) {
            var self = this;

            var xpointer;
            for (xpointer in self.fragments) {
                var fragment = self.fragments[xpointer];
                if (typeof fragment.items != "undefined")
                    for (var i=0; i<fragment.items.length; i++)
                        if (fragment.items[i].uri == uri) 
                            return fragment.associatedXpointer;
            } // for index
            return "ERROR: No xpointer for uri "+uri;
        },

        
        // Will return the markup for every statement of the given item
        getStatementsMarkup : function (xpointer, item, associatedXpointer) {
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

            self.log("## Show note "+xpointer);
            self.hideAllNotes();
            $('div#' + noteDivId).removeClass('collapsed').addClass('expanded');
            return;
        },
        
        hideNote : function (xpointer) {
            var self = this,
            hash = self.getHashFromXpointer(xpointer),
            noteDivId = hash+"-note";
            self.log("## Hide note "+xpointer);
            $('div#' + noteDivId).addClass('collapsed').removeClass('expanded');
            return;
        },

        hideAllNotes : function () {
            var self = this;
            THCTagCore.Annotate.deselectFragment();
            for (i in self.fragments) {
                self.log("## Will hide note "+i);
                self.hideNote(i);
            }
            self.log("## Hide ALL NOTES end");
            return;
        },


        log: function(w) {

            if (this.options.debug == false)
                return;
            
            if (typeof console == "undefined") {
                if ($("#debug_foo").attr('id') == null) 
                    $("body").append("<div id='debug_foo' style='position: absolute; right:2px; bottom: 2px; border: 1px solid red; font-size: 1.1em;'></div>");
                $("#debug_foo").append("<div>"+w+"</div>");
            } else {
                console.log("## JTHC ## "+w);
            }
        } // log
    }; // $.jthc.prototype

});
