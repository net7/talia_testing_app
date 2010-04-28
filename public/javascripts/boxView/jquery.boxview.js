(function($) {  
	
	// BoxView jQuery object constructor
	$.fn.boxView = function(opts) {

		// get "real" options merging defaults and 
		// opts given by user
		var options = $.extend($.boxView.defaults, opts);

		// Spawn a boxview for every element we are calling this on
		return this.each(function(){
			new $.boxView(this, options)
		});

	}; // $.fn.boxView()


 	// BoxView constructor
	$.boxView = function (element, opts) {
		
		// Global options for this boxView, right into the object
		this.options = $.extend({}, $.boxView.defaults, opts);

		// Boxes container
		this.container = $(element);
		this.init();

	}; // $.boxView()


	// DEFAULTS: Every boxView will be initialized with these defaults
	// if not explicitly overwritten by the user
	$.boxView.defaults = {
		// Class added to the box when collapsed
		collapsedClass: 'collapsedBox',

		// Class added to the box when expanded
		expandedClass: 'expandedBox',
		
		// Class added while the box is loading
		loadingClass: 'loadingContent',
		
		// Default type (used as class in the markup)
		type: 'defType',

		// Is a box initially collapsed?
		collapsed: 0,

		// Box width when collapsed, pixels
		collapsedWidth: 70,

		// Space between boxes
		boxMargin: 2,
		
		// Pixel to substrat to box width when setting .resizeme images
		resizemeImagesMargin: 20,

		// Animations
		animateAdd: false,
		animateRemove: false,
		animateCollapse: false,
		animateResize: false,

		// Use base64 encoding for resId field in the AnchorMan desc??
		encodeResId: true,

		// Used internally
		isBeingDragged: 0,
		isFirstShow: 1,
		isLoading: false,
		
		
		// Default title and resource id
		title: "Default title",
		verticalTitle: "Vertical: Default title",
		resId: "0",
		
		debug: false

	};

	
	$.boxView.prototype = {
		init : function() {

			// Create a name for this boxView
			this.boxViewName = this.createHash();

			// Add the real boxview container (bvc) and get the jQuery object, 
			// get the son of this container so we can add as many boxViews
			// as needed on the same page
			this.container.append("<div id='"+ this.boxViewName +"' class='boxViewContainer'></div>");
			this.bvc = $('#' + this.boxViewName);

			// Current number of boxes
			this.n = 0;
			
			// Options objects for each box
			this.boxOptions = [];
			
			// Undo list
			this.undoList = [];

			// Connect some callbacks, if there's any
			this.onSortFunction = (typeof(this.options.onSort) == "function") ? this.options.onSort : null;
			this.onAddFunction = (typeof(this.options.onAdd) == "function") ? this.options.onAdd : null;
			this.onRemoveFunction = (typeof(this.options.onRemove) == "function") ? this.options.onRemove : null;
			this.onCollapseFunction = (typeof(this.options.onCollapse) == "function") ? this.options.onCollapse : null;
			this.onExpandFunction = (typeof(this.options.onExpand) == "function") ? this.options.onExpand : null;
			this.onReplaceFunction = (typeof(this.options.onReplace) == "function") ? this.options.onReplace : null;


            // 1 if we are dragging a box
            this.dragging = 0;

			// Will be used to notice if box order has changed during dragNdrop, 
			// if it's changed the orderChangeFunction will be called passing this
			// order as parameter
			this.lastOrder = [];
			
			// Used in anonymous functions
			var thisBoxView = this;

			// Adding the event delegation for collapse and remove tool, bind it
			// to this div only so if there are more boxview on the same page we
			// dont bind twice every element
			$("div#"+ this.boxViewName +" div p.removeTool").live("click", function() { 
					thisBoxView.removeBox($(this).parents('div.box').attr('id'));
					thisBoxView.resize();
				});
			$("div#"+ this.boxViewName +" div p.collapseTool").live("click", function() { 
					thisBoxView.toggleCollapseBox($(this).parents('div.box').attr('id'));
					thisBoxView.resize();
				});
			$("div#"+ this.boxViewName +" div.boxHeader, div#"+ this.boxViewName +" div.dragOverlay").live("dblclick", function() { 
				    thisBoxView.toggleCollapseBox($(this).parents('div.box').attr('id'));
					thisBoxView.resize();
				});



			// Little IE fix: put a timer to buffer mutiple resize events:
			// this will call resize() only after N ms after user stopped 
			// resizing the window
			var resizeTimer = null;
			$(window).resize(function(){
			    if (resizeTimer) clearTimeout(resizeTimer);
			    resizeTimer = setTimeout(function() { thisBoxView.resize(); }, 100);
			});

			// Initial positioning
			this.resize();

		},
		
		// Recalculate sizes of all boxes
		resize : function() {

			// Make the box container height match it's own container's height
			this.bvc.height(this.container.height());

			// No boxes -> no resize
			if (this.n == 0) {
				this.bvc.html("");
				return;
			}

			// Set all boxes height to match bvc's height, both the exterior div.box
			// and the internal div.boxContent heights!
			var fooH = this.container.height() - $(".boxHeader").height();
			$(this.bvc).find('div.box').height(this.container.height());
			$(this.bvc).find('div.box div.boxContent').height(fooH);

			// num of expanded/collapsed boxes and
			// width available to the expanded boxes
			var expanded = 0, 
				collapsed = 0,
				expandedWidth = $(this.bvc).width();

			// If we have a collapsed box substract this collapsed box
			// width from the width available to expanded boxes
			for (i=0; i<this.n; i++)
				if (this.boxOptions[i].collapsed == 1) {
					collapsed++;
					expandedWidth -= parseInt(this.boxOptions[i].collapsedWidth);
				} else {
					expanded++;
				}

			// subtract margins from boxes available width
			expandedWidth -= this.options.boxMargin * (this.n - 1);

			// BaseWidth is exactly the expanded boxes available width divided
			// by the num of exp. boxes, WidthRemainder is the division remainder.
			// Eg: avail width=10, exp boxes=4, BaseWidth=10/4=2, remainder=2
			var boxBaseWidth = Math.floor(expandedWidth / expanded);
			var boxWidthRemainder = Math.floor(expandedWidth % expanded);


			// foox will keep the 'left' css value of the current box, to
			// position boxes from left to right.
			// The cycle will add an extra width pixel for each box until
			// consumed boxWidthRemainder
			var foox = 0;
			for (i=0; i<this.n; i++) {

				// calculate this box width and left position
				if (this.boxOptions[i].collapsed == 1) {
					this.boxOptions[i].width = this.boxOptions[i].collapsedWidth;
				} else {
					// if boxWidthRemainder is greater than 0, we enlarge
					// this box width by 1 pixel, decreasing boxWidhtRemainder by 1
					var correction = (boxWidthRemainder-- > 0) ? 1 : 0;
					this.boxOptions[i].width = boxBaseWidth + correction;
				}

				this.boxOptions[i].left = foox;
				foox += this.boxOptions[i].width + this.options.boxMargin;

			} // for i

			// Finally repaint with the new values
			this.repaint();

		}, // resize()

        getFlashMarkup : function (title, width, height) {

            var ret = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+ width +'" height="'+ height +'" id="movie" align="middle">'+
            	      '<param name="allowScriptAccess" value="sameDomain" />'+
            	      '<param name="allowFullScreen" value="false" />'+
            	      '<param name="movie" value="css/vertical_title.swf?title='+ title +'" />'+
            	      '<param name="quality" value="high" />'+
            	      '<param name="wmode" value="transparent">'+
            	      '<embed src="css/vertical_title.swf?title='+ title +'" quality="high" wmode="transparent" width="'+ width +'" height="'+ height +'" name="movie" align="middle" allowScriptAccess="sameDomain" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />'+
                      '</object>';
            return ret;
            
        }, // getFlashMarkup()

		// Draws/animates the new positions and sizes of all boxes
		repaint : function () {

			for (i=0; i<this.n; i++) {
				var box = $('#'+this.boxOptions[i].id);

                // Dont redraw everything if we are dragging .. 
                if (!this.dragging) {

    				// Resize the collapsed and expanded content to parent's width and height
    				if (this.boxOptions[i].collapsed == 1) {

    				     
    				    var topHeight = $('#'+this.boxOptions[i].id+' div.boxHeader').height();
    				    var h = box.height() - topHeight;
    				    var e = $('#'+this.boxOptions[i].id+' div.boxCollapsedContent');
    				    
    				    // Check if the height is different (is it a resize?)
    				    if (e.height() != h) {
    				    
    					    e.height(h);
    					    e.width(this.boxOptions[i].width);

                            // Resize the dragOverlay to the full box width and height and and
                            // flashcontainer to the proper size
    					    $('#'+this.boxOptions[i].id+' div.boxCollapsedContent .dragOverlay').css({'height': h, 'top': topHeight});
                            $('#'+this.boxOptions[i].id+' div.boxCollapsedContent .flashcontainer').html(this.getFlashMarkup(this.boxOptions[i].verticalTitle.toUpperCase(), this.boxOptions[i].collapsedWidth, h-5));
                        }
                    
    				} else {
    				    $('#'+this.boxOptions[i].id+' div.boxContent').height(box.height() - $('#'+this.boxOptions[i].id+' div.boxHeaderTools').height());
				    }
				
                    // width of this box minus a resizeme margin
    				var boxWidth = this.boxOptions[i].width - 2*this.options.resizemeImagesMargin;

    				// Autoresize "resizeme" class: img just set the width, divs are flash containers
    				// need to get the ratio and act concordingly
    				var img = $("#" + this.boxOptions[i].id + " img.resizeme");
                    var obj = $("#" + this.boxOptions[i].id + " div.resizeme");
                    var ratio = parseInt($(obj).find('embed:first').attr('ratio'));
                    var objHeight = boxWidth*ratio/10000;

    				if (img.width() != boxWidth)
    				    if (this.options.animateResize) {
    					    img.animate({width: boxWidth}, this.options.animationLength);
                            obj.animate({width: boxWidth, height: objHeight}, this.options.animationLength);
    				    } else {
    					    img.css({width: boxWidth});
                            obj.css({width: boxWidth, height: objHeight});
					    }


                } // if !this.dragging

				// First time we display this box, animate or not?
				if (this.boxOptions[i].isFirstShow == 1) {

					if (this.options.animateAdd == true) {
						box.css({width: 10, left: (this.boxOptions[i].left + this.boxOptions[i].width)});
						box.animate({width: this.boxOptions[i].width, left: this.boxOptions[i].left}, this.options.animationLength);
					} else 
						box.css({width: this.boxOptions[i].width, left: this.boxOptions[i].left});
						
					this.boxOptions[i].isFirstShow = 0;

				} else {

					// Dont redraw the items which are being dragged!
					if (this.boxOptions[i].isBeingDragged == 0)
						if (this.options.animateResize == true)
							box.stop().fadeTo(0, "1.0").animate({width: this.boxOptions[i].width, left: this.boxOptions[i].left}, this.options.animationLength);
						else 
							box.css({width: this.boxOptions[i].width, left: this.boxOptions[i].left});

				} // if isFirtShow()

			} // for

		}, // repaint()


		// Will add a box without calling any callback 
		addBoxSilent : function (boxContent, opts) {

			// I there's a position supplied, copy the actual boxOptions hash
			// leaving a blank space in the Nth position, then do the
			// usual stuff on boxOptions[n]
			var n = NaN;
			if (typeof(opts) != "undefined")
				n = parseInt(opts.position);

			var foo = {};
			foo['boxOptions'] = {};
			if (n >= 0) {

				// Cycle over all boxes and just skip the nth box
				// j cycles over the old hash, i over the new and thus will jump
				for (i=0, j=0; j<this.n; i++) 
					if (i != n) 
						foo.boxOptions[i] = $.extend({}, this.boxOptions[j++], {});
						
				// Copy back the options in boxOptions
				this.boxOptions = $.extend({}, foo.boxOptions, {});

			} else {
				// Otherwise just add it in the last position
				n = this.n;
			}

			if (this.options.debug) console.log("BV: adding a box in position "+n);

			// Extend default options with those given by user
			this.boxOptions[n] = $.extend({}, this.options, opts);
			var boxopt = this.boxOptions[n];

			// If we gave a name adding this box, use it
			if (typeof(boxopt['id']) == "undefined")
				boxopt['id'] = this.createHash(5);

			boxopt['content'] = boxContent;
			
			// Markup of this box, set the right class
			var html = "<div class='box " + boxopt['type']+" ";
			html += (boxopt['collapsed'] == 1) ? 'collapsed' : 'expanded';
			html += "' id='"+boxopt['id']+"'>"+
					// Box header
					"<div class='boxHeader boxDragHandle'>"+
						"<h3 class='boxHeaderTitle'>" + boxopt['title'] + "</h3>"+
						"<div class='boxHeaderTools'>"+
							"<p class='boxTool collapseTool'>^^</p>"+
							"<p class='boxTool removeTool'>xx</p>"+
						"</div>"+
					"</div>"+
					// Box Content
					"<div class='boxContent'>"+boxopt['content']+"</div>"+
					"<div class='boxCollapsedContent'><div class='dragOverlay boxDragHandle'></div><div class='flashcontainer'></div></div>"+
					"</div>";

			boxopt['html'] = html;

			// Adding the box to the boxviewcontainer
			this.bvc.append(html)
			this.n = this.n + 1;

			// Make boxes draggable, sets some properties and attach functions
			// to handle drag, dragstart and dragend inside boxView.
			var thisBoxView = this;
			$('#'+boxopt['id']).draggable({ 
				containment: 'parent', 
				handle: '.boxDragHandle',
				cursor: 'move',
				opacity: 0.70,
				stack: { group: "gino", min: 10},
				start: function() { thisBoxView.dragStart($(this).attr('id')); },
				drag: function() { thisBoxView.drag($(this).attr('id')); },
				stop: function() { thisBoxView.dragStop($(this).attr('id')); }
			});

			if (this.options.debug) console.log("BV: Added box "+boxopt['id']+" in position " + this.n + " with resId " +  boxopt['resId']);

			// Calculate sizes again
			this.resize();
			
		}, // addBoxSilent()
		
		
		// Will add a box and call an eventual callback
		addBox : function(html, opts) {

			if (this.options.debug) console.log("BV: calling addBox with "+opts);

			// Little IE bug: cant test for opts.id if opts itself is already undefined
			// Check if there's already a box this the given id (if the given id is not
			// the default one!)
			if (typeof(opts) != 'undefined')
			 	if (typeof(opts.resId) != 'undefined' && opts.resId != this.options.resId) 
			 		if (this.getIdFromResId(opts.resId) != -1) {
						if (this.options.debug) console.log("BV: There's already a box with resId="+opts['resId']+" .. flashing it");

						if (this.options.animateResize == true)
							$('#' + this.getIdFromResId(opts.resId)).fadeTo(200, "0.3").fadeTo(200, "1.0").fadeTo(200, "0.3").fadeTo(200, "1.0");
							
						return false;
					}

			if (this.options.debug) console.log("BV: calling addBoxSilent with "+opts);
			this.addBoxSilent(html, opts);
			
			// Call the onAdd callback
			if (typeof(this.onAddFunction) == "function") 
				this.onAddFunction.call(this);

		}, // addBox()


        // Replaces a box's content
        replaceBoxContent: function(boxId, opts) {

            for (i=0; i<this.n; i++) {
                var b = this.boxOptions[i];
				if (b['id'] == boxId) {

				    b.resId = opts.newResId;
				    b.content = opts.newContent;
				    b.title = opts.newTitle;
				    b.verticalTitle = opts.newVerticalTitle;
				    b.qstring = opts.newQstring;

				    $('div#'+boxId+" div.boxContent").html(opts.newContent);
				    $('div#'+boxId+" h3.boxHeaderTitle").html(opts.newTitle);
				    
        			// Call the onReplace callback
        			if (typeof(this.onReplaceFunction) == "function") 
        				this.onReplaceFunction.call(this);

                    // Call resize mainly for the .resizeme images
        			this.resize();
        			return true;
				} // if 'id' = boxId
			} // for i
			
			return false;
            
        }, // replaceBoxContent

        // Updates the internal 'content' field to reflect external HTML
        // injections
        checkBoxContent: function(boxId) {
			for (var i=0; i<this.n; i++) {
			    var b = this.boxOptions[i];
				if (b['id'] == boxId) {
					if (b.content != $('div#'+boxId+" div.boxContent").html())
					    b.content = $('div#'+boxId+" div.boxContent").html();
					return true;
				}
			}
			return false;
        },


		// Returns the box id from the given Resource ID
		getIdFromResId: function (resId) {
			for (var i=0; i<this.n; i++)
				if (this.boxOptions[i].resId == resId)
					return this.boxOptions[i].id;
			return -1;
		}, // getIdFromResId()


		// Start and stop Drag function just set/unset the isBeingDragged flag
		// into the boxOptions hash
		dragStart: function (id) {

			this.lastOrder = [];
			for (var i=0; i<this.n; i++) {
			
				// Set last order at dragstart, so at drag end we can notice
				// a change
				this.lastOrder[i] = this.boxOptions[i].id;

				if (this.boxOptions[i].id == id) {
					this.boxOptions[i].isBeingDragged = 1;
                    this.dragging = 1;
				}
			} // for i

		}, // startDrag


		dragStop: function (id) {

			// Set z-index back to normal
			$('#'+id).css({"z-index": 1});

			var s="",
				newOrder = [],
				isOrderChanged = false;
			
			for (i=0; i<this.n; i++) {

				// Is the new order different from the last one?
				newOrder[i] = this.boxOptions[i].id;
				if (this.lastOrder[i] != newOrder[i])
					isOrderChanged = true;

				if (this.boxOptions[i].id == id) {
					this.boxOptions[i].isBeingDragged = 0;
					this.dragging = 0;
					//console.log('stop dragging: '+id + " : "+this.boxOptions[i].isBeingDragged);
				}

				s += i+":"+this.boxOptions[i].isBeingDragged+", ";
			}
			//console.log("Other drags: "+s);

			if (isOrderChanged) {
				this.lastOrder = newOrder;

				// Call the onSort callback
				if (typeof(this.onSortFunction) == "function") 
					this.onSortFunction.call(this, newOrder);
				
			} // if isOrderChanged

			this.resize();
		}, // stopDrag

		// Called at every drag movement of the mouse.. so.. a lot!
		drag : function(id) {

			// Leftmost and rightmost x coordinate of the dragged box, along
			// with its central point x coordinate.
			// drag_box is the index of the dragged box into the boxOptions array,
			// moving_box is the index of the box that should move to make room to drag_box
			var drag_left = parseInt($('#'+id).css('left')),
				drag_right = drag_left + parseInt($('#'+id).css('width')),
				drag_middle = Math.floor((drag_left+drag_right)/2),
				drag_box = -1,
				moving_box = -1,
				changed = false;

			// Find what's the box we are dragging
			for (var i=0; i<this.n; i++)
				if (this.boxOptions[i].id == id)
					drag_box = i;

			// Dragged box was on this coordinates before drag happened
			var old_drag_left = this.boxOptions[drag_box].left,
				old_drag_right = this.boxOptions[drag_box].left + this.boxOptions[drag_box].width;

			// Just skip all boxes but previous and next to dragged box
			for (var i=0; i<this.n; i++) {
				if (i != drag_box && (i==drag_box+1 || i==drag_box-1)) {

					// Current box left, right and middle coordinates
					var left = parseInt(this.boxOptions[i].left),
						right = parseInt(this.boxOptions[i].width) + left,
						middle = Math.floor((left+right)/2);
					
					// Dragging in right direction
					if (old_drag_left < left && drag_right > middle) {
						//console.log("#RR: "+drag_left+":"+drag_middle+":"+drag_right+" -- "+left+":"+middle+":"+right+" -- "+this.boxOptions[i].left);
						changed = "right";
						moving_box = i;

						this.boxOptions[moving_box].left = old_drag_left;
						this.boxOptions[drag_box].left += this.boxOptions[moving_box].width + this.options.boxMargin;
					} 

					// Dragging in left direction
					if (old_drag_right > right && drag_left < middle) {
						//console.log("#LL: "+drag_left+":"+drag_middle+":"+drag_right+" -- "+left+":"+middle+":"+right);
						changed = "left";
						moving_box = i;

						var foo = this.boxOptions[moving_box].left;
						this.boxOptions[moving_box].left += this.boxOptions[drag_box].width + this.options.boxMargin;
						this.boxOptions[drag_box].left = foo;
					} 
					
				} // if boxOptions[i].id != id
			} // for i

			// Finally switch boxOptions elements and repaint() !
			if (changed != false) {
				var foo = $.extend({}, this.boxOptions[moving_box], {});
				this.boxOptions[moving_box] = this.boxOptions[drag_box];
				this.boxOptions[drag_box] = foo;
				this.repaint();
			} // if changed != -1
			
		}, // drag


		// Used to toggle the loading class
		setLoading : function(id, val) {
			for (i=0; i<this.n; i++) {
			    var b = this.boxOptions[i];
				if (b['id'] == id) {
					b.isLoading = val;
					if (val) 
						$('#' + id).addClass(b.loadingClass);
					else 
						$('#' + id).removeClass(b.loadingClass);
					
					this.checkBoxContent(id);
					return;
				}
			}
			return;
		},

		undoPush : function (box) {
			// TODO : Check length here!
			this.undoList.push(box);
		},

		undo : function () {
			if (this.undoList.length > 0) {
				var b = this.undoList.pop();
				this.addBox(b.content, b);
				return true;
			} else {
				return false;
			}
		},

        getUndoNumber : function () {
            return this.undoList.length;
        },

        getBoxesNumber : function () {
            return this.n;
        },

		// Removes the box with the given id from the box view container
		removeBox : function (id) {

			// Will contain the options without the removed box
			var foo = {};
			foo['boxOptions'] = {};

			// Cycle over all boxes and just dont copy the selected
			// id box
			for (i=0,j=0; i<this.n; i++)
				if (this.boxOptions[i]['id'] != id) {
					foo.boxOptions[j++] = $.extend({}, this.boxOptions[i], {});
				} else {
					// Save the box in the undo list
					this.undoPush($.extend({}, this.boxOptions[i], {}));
				}

			// Copy back the options in the boxOptions space
			this.boxOptions = $.extend({}, foo.boxOptions, {});
			this.n--;

			// Remove the element from DOM
			if (this.options.animateRemove == true)
			    $("#"+id).fadeOut(this.options.animationLength).remove();
				// $("#"+id).effect("explode",{}, this.options.animationLength);
            else
			    $('#'+id).remove();

			// Call the onRemove callback
			if (typeof(this.onRemoveFunction) == "function") 
				this.onRemoveFunction.call(this);

		},
		
		// Toggle the collapse flag: sets true if it's false
		// and vice-versa
		toggleCollapseBox : function (id) {

			// Cycling over all boxes options, as soon as we find the given
			// box we toggle its collapsed flag, add/remove collpsed/expanded
			// classes and return
			for (i=0; i<this.n; i++)
				if (this.boxOptions[i]['id'] == id) {

					// Expanding the box
					if (this.boxOptions[i].collapsed == 1) {

						this.boxOptions[i].collapsed = 0;
						$('#' + id).removeClass("collapsed").addClass("expanded");

						// Call the onExpand callback
						if (typeof(this.onExpandFunction) == "function") 
							this.onExpandFunction.call(this, "expand parameters");

					// Collapsing the box
					} else {
						
						this.boxOptions[i].collapsed = 1;
						$('#' + id).removeClass("expanded").addClass("collapsed");

						// Call the onCollapse callback
						if (typeof(this.onCollapseFunction) == "function") 
							this.onCollapseFunction.call(this, "collapse parameters");

					}

					return;
				} // if boxOptions[i][id] == id
		}, // toggleCollapseBox()


		// Gets an object in the anchorman format: an array of arrays, 
		// containing info on boxes
		getAnchorManDesc : function() {
		
			var foo = [], resId = null, qstring;
			for (var i=0; i<this.n; i++) {
			    var b = this.boxOptions[i];
				resId   = (this.options.encodeResId == true) ? $.base64Encode(b.resId) : b.resId;
				qstring = (this.options.encodeResId == true) ? $.base64Encode(b.qstring) : b.qstring;
				foo[i] = [b.id, resId, b.type, b.collapsed, qstring];
			}
			if (this.options.debug) console.log("getAnchorManDesc: "+foo);
			return foo;
		}, // getAnchorManDesc()


		// gets an array of boxes ids and sorts the boxes accordingly
		sortLike : function(newOrder) {
			
			// Giving an order whose size doesnt match current boxes number ..
			// .. just return.
			if (newOrder.length != this.n) 
				return;
			
			var foo = {};
			foo['boxOptions'] = {};

			// Crappy cycle to set the boxes in the right order
			for (var i=0; i<this.n; i++) 
				for (var j=0; j<this.n; j++) 
				 	if (this.boxOptions[j]['id'] == newOrder[i]) 
						foo.boxOptions[i] = $.extend({}, this.boxOptions[j], {});

			// Copy back the options in the boxOptions space
			this.boxOptions = $.extend({}, foo.boxOptions, {});
			this.lastOrder = newOrder;

			// Call the onSort callback
			if (typeof(this.onSortFunction) == "function") 
				this.onSortFunction.call(this, newOrder);
			
		}, // sortLike()

		// Toggles animations on or off
		toggleAnimations : function() {
			this.options.animateAdd = ! this.options.animateAdd;
			this.options.animateRemove = ! this.options.animateRemove;
			this.options.animateCollapse = ! this.options.animateCollapse;
			this.options.animateResize = ! this.options.animateResize;
		},
		
		setAnimations : function (value) {
			this.options.animateAdd = value;
			this.options.animateRemove = value;
			this.options.animateCollapse = value;
			this.options.animateResize = value;
		},
		

		// Generates an N items random hash code, to use as box id
		createHash : function(n) {
			var i=0, 
				str="";
				
			if (typeof(n) == "undefined")
				n = 10;

			while (i++ <= n) {
				var rnd = Math.floor(Math.random()*36);
				str += "abcdefghijklmnopqrstuvz0123456789".substring(rnd, rnd+1);
			}
			return str;
		} // createHash()
		
	}; // $.boxView.prototype
	
})(jQuery);
