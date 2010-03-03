

// compatibility mode
//jQuery.noConflict();

var thcButtonName = 'THCLinkButton';
var thcAnchorClass = 'THCAnchor';
var thcSearchResult = 'THCSearchResult';
var thcAnnotationsBoxClass = 'THCAnnotationsBox';

var thcContentClass = new Array();
thcContentClass[0] = 'THCContent';
thcContentClass[1] = 'txt_block';
thcContentClass[2] = 'THCContent txt_block';
thcContentClass[3] = 'txt_block THCContent';

var THC_DEBUG_MODE = false;
var INLINE_HIGHLIGHTING = true;
var CONTENT_ID_SUFFIX = "_text";


THCTag = {
    // return XPointer from current selection
    getXPointerFromSelection: function() {
        return THCTag.getXPointerFromSelectionWithAction("selection");
    },
    
    getXPointerFromSelectionWithAction: function(action) {
    	THCTagCore.Annotate.deselectFragment();
    	
    	var result = THCTagCore.XPath.getXPointerFromSelection();
        var results = new Array();
        results[0] = result;
        var content = THCTagUtil.extractContentFromRange(THCTagCore.getSelectedRange());
        var contents = new Array();
        contents[0] = content;
        THCTagUtil.writeMessage(action, results, contents);
        THCTagCore.setUserSelection(null);
        return result;
    },

    // add THCTag by XPointer
    addByXPointer: function(xPointer) {
    	if (THC_DEBUG_MODE) {
    		alert('Method:addByXPointer\n' +
    				'xPointer: ' + xPointer);	
    	}
        var splittedXPointer = THCTagCore.xPointerToXPath(xPointer);
        if (THC_DEBUG_MODE) {
    		alert('Method:addByXPointer\n' +
    				'splittedXPointer: ' + splittedXPointer);	
    	}
        //alert('Splitted: ' + splittedXPointer);
        var startUrl = THCTagCore.getUrlFromXPointer(xPointer);
        //alert('Url: ' + startUrl);
        if (startUrl == null || startUrl == '') {
        	startUrl = window.location.href;
        	if (startUrl.indexOf('#') != -1) {
        		startUrl = startUrl.split('#')[0];
        	}
        }

        this.addByXPath(startUrl, splittedXPointer[0][0], splittedXPointer[0][1], splittedXPointer[1][0], splittedXPointer[1][1]);
    },

    // add THCTag by XPath
    addByXPath: function(startUrl, startXPath, startOffset, endXPath, endOffset) {
    	if (THC_DEBUG_MODE) {
    	alert('Method:addByXPath\n' +
    			'StartURL: ' + startUrl + ' StartXPath: ' + startXPath + ' StartOffset: ' + startOffset + ' EndXPath: ' + endXPath + ' EndOffset: ' + endOffset);	
    	}
    	
        if((startXPath != endXPath) || ((startXPath == endXPath) && (parseInt(startOffset) < parseInt(endOffset)))) {
        	THCTagCore.Annotate.addTHCTagsFromXPath(startUrl, startXPath, startOffset, endXPath, endOffset);    
        }
  		
    },


    // show annotation
    show: function(startUrl, startXPath, startOffset, endXPath, endOffset) {
		
		THCTagCore.Annotate.deselectFragment();
		
		// Validating Xpath using document.eval is not correct as it does not take into account THC tags that cna be present.
		// For example if the Xpath points to a <a>, there are problems with the thc anchor...
		/*
		var validStart = THCTagCore.Annotate.validateXPath(startXPath);
		var validEnd = THCTagCore.Annotate.validateXPath(endXPath);
		
		if (!validStart || !validEnd) {
			alert("WARNING: The requested page fragment does not exist any more.");
			return;
		}
		*/

    	var xpointer = THCTagCore.XPath.getXPointerString(startUrl, startXPath, startOffset, endXPath, endOffset);
    	
    	var xpointers = new Array();
    	xpointers[0] = xpointer;
        
        THCTagUtil.writeMessage("focus", xpointers, '');
        THCTagCore.Annotate.showNoteById(startXPath, startOffset, endXPath, endOffset);
        //location.href = '#' + THCTagCore.XPath.getXPointerRanges(startXPath, startOffset, endXPath, endOffset);
    },
    
    showByXPointer: function(xPointer) {
    	var splittedXPointer = THCTagCore.xPointerToXPath(xPointer);
    	var startUrl = THCTagCore.getUrlFromXPointer(xPointer);
    	if (startUrl == null || startUrl == '') {
    		startUrl = window.location.href;
    	}
    	//alert('start: ' + splittedXPointer[0][0] + ' off: ' + splittedXPointer[0][1] + ' end: ' + splittedXPointer[1][0] + ' off: ' + splittedXPointer[1][1]);
    	THCTag.show(startUrl, splittedXPointer[0][0], splittedXPointer[0][1], splittedXPointer[1][0], splittedXPointer[1][1]);
    },

    hide: function() {
    	
        THCTagUtil.writeMessage("focus", null, '');
    },
    
    getContentURIs: function() {
    	var contentUris = new Array();
    	for(var index=0; index<thcContentClass.length; index++) {
    		var contentElements = document.getElementsByClassName(thcContentClass[index]);
			for(var i=0; i < contentElements.length; i++) {
				var contentUrl = contentElements[i].getAttribute('about');
				if (contentUrl==null) {
					contentUrl = contentElements[i].getAttribute('id');
				}
				contentUris[i] = contentUrl;
			}	
    	}
		return contentUris;
		
    }
};

var userSelection;

THCTagCore = {
    // get start container
    getStartContainer: function() {
        var range = THCTagCore.getSelectedRange();
        return range.startContainer;
    },

    // get start offset
    getStartOffset: function() {
        var range = THCTagCore.getSelectedRange();
        return range.startOffset;
    },

    // get end container
    getEndContainer: function() {
        var range = THCTagCore.getSelectedRange();
        return range.endContainer;
    },

    // get end offset
    getEndOffset: function() {
    
        var range = THCTagCore.getSelectedRange();
        return range.endOffset;
    },

    // get selected text
    // Note: this function crashes, stopping the JS execution if is called before the user clicked inside the browser window.
    getSelectedRange: function() {
    	var result;
    
	    	//if something has been selected...
        	if (window.getSelection().rangeCount > 0)
        	{
            	result = window.getSelection().getRangeAt(0);
            	
            	//alert("Start: " + result.startContainer.tagName + " " + result.startOffset + " End: " + result.endContainer.tagName + " " + result.endOffset);
            	
            	//if the selected range is not empty (this happens when the user cliks on something)...
            	if  (result!=null && (result.startContainer == result.endContainer) && (result.startOffset == result.endOffset) ){
       				result = null;
       			}
            	
        	} else {
        		result = null;
        	}
        	
        	if (result == null && userSelection!=null && userSelection!=undefined) {
        		result = userSelection;
        	} 
        
        	var startContainer = result.startContainer;
        	var startOffset = result.startOffset;
        	var endContainer = result.endContainer;
        	var endOffset = result.endOffset;
        	
        	
        	while (THCTagCore.isTHCTag(startContainer)) {
        		startContainer = startContainer.nextSibling;
        		startOffset = 0;	
        	}
        	while (THCTagCore.isTHCTag(endContainer)) {
        		endContainer = endContainer.nextSibling;
        		endOffset = 0;
        	}
        	result.setStart(startContainer, startOffset);
        	result.setEnd(endContainer, endOffset);
      	
        return result;
    },

	addClickImageHooks: function() {
		var imgTags = document.getElementsByTagName("img");
		for (var i = 0; i < imgTags.length; i++) {  
			imgTags[i].setAttribute('onMouseDown','THCTagCore.setUserSelection(THCTagCore.getRangeFromTag(this));');
		}; 
	},

	getRangeFromTag: function(el) {
		
		var range = document.createRange();
		range.selectNode(el);
		return range;
		
	},

	setUserSelection: function(s) {
	
		userSelection = s;
		
	},

    // check if element is a THCTag
    isTHCTag: function(e) {
    	
        if(e.nodeType == Node.ELEMENT_NODE  && (e.getAttribute('class') == thcButtonName)) {
            return true;
        }
        
        if(e.nodeType == Node.ELEMENT_NODE  && (e.getAttribute('class') == thcAnchorClass)) {
            return true;
        }
        
        if(e.nodeType == Node.ELEMENT_NODE  && (e.getAttribute('class') == thcAnnotationsBoxClass)) {
            return true;
        }
        

        return false;
    },
    
    isTextNode: function(e) {
    	if (e.nodeType == Node.TEXT_NODE) {
    		return true;	
    	}
    	return false;
    },
    
    isElementNode: function(e) {
    	if (e.nodeType == Node.ELEMENT_NODE) {
    		return true;
    	}
    	return false;
    },
    
    isCommentNode: function(e) {
    	if (e.nodeType == Node.COMMENT_NODE) {
    		return true;
    	}
    	return false;
    },
    
    // check if element is an THCContnt element
    isTHCContent: function(e) {
    	
    	var result = false
        if(e.nodeType == Node.ELEMENT_NODE) {
        	for(var index=0; index<thcContentClass.length; index++) {
        		if ((e.getAttribute('class') == thcContentClass[index])) {
        			result = true;
        		}
        	}
        }

        return result;
    },


    xPointerToXPath: function(xpointer) {
        var startXPath = "";
        var startOffset = -1;
        var endXPath = "";
        var endOffset = -1;

        var splittedString = xpointer.split("#xpointer(start-point(string-range(")[1];
        splittedString = splittedString.split("))/range-to(string-range(");

        startXPath = splittedString[0].split(",'',")[0];
        startOffset = splittedString[0].split(",'',")[1];

        splittedString = splittedString[1].substr(0, splittedString[1].length - 3);

        endXPath = splittedString.split(",'',")[0];
        endOffset = splittedString.split(",'',")[1];

        return [[startXPath, startOffset], [endXPath, endOffset]];
    },
    
    getUrlFromXPointer: function(xpointer) {
    	return xpointer.split("#xpointer(start-point(string-range(")[0];
    }

};

THCTagCore.XPath = {

    // get XPointer from current selection
    getXPointerFromSelection: function() {
        // return if there isn't a selection
        //if(THCTagCore.getSelectedText() == "") return null;
		
		if (THCTagCore.getSelectedRange() == null) {
			return '';
		};
		
        // get selected node and offset
        var selectedRange = THCTagCore.getSelectedRange();
        var startContainer 	= selectedRange.startContainer;
        var startOffset 	= selectedRange.startOffset;
        var endContainer 	= selectedRange.endContainer;
        var endOffset 		= selectedRange.endOffset;

        //alert("startContainer: " + startContainer.nodeName + " startOff: " + startOffset + " endContainer: " + endContainer.nodeName + " EndOff: " + endOffset);
        //alert("calculating start offset...");
        startOffset = THCTagCore.XPath.calculateOffset(startOffset, startContainer);
        //alert("calculating end offset...");
        endOffset = THCTagCore.XPath.calculateOffset(endOffset, endContainer);
        
        // recostruct the XPath from THC_Tag
        //alert("calculating starting XPath");
        var startXPath 	= this.getXPath(startContainer);
        //alert("start: " + startXPath + " - " + startOffset);
        
        //alert("calculating endingXPath");
        var endXPath 	= this.getXPath(endContainer);
		//alert("start: " + endXPath + " - " + endOffset);

        // translate current pointer to original document pointer
        //var startPoint = THCTagCore.XPathTranslator.tranlsateXPathToOriginal(startXPath, startOffset, 'forward');
        //var endPoint = THCTagCore.XPathTranslator.tranlsateXPathToOriginal(endXPath, endOffset, 'backward');

		//alert("start transformed: " + startPoint);

        //startXPath = startPoint[0];
        //startOffset = startPoint[1];
        //endXPath = endPoint[0];
        //endOffset = endPoint[1];

        // create xpointer string
        var xpointerUrl = THCTagCore.XPathTranslator.getContentIDFromXPath(startXPath);
        
        var result = this.getXPointerString(xpointerUrl, startXPath, startOffset, endXPath, endOffset);
		
        return result;
    },

	//Given a node and an offset, skips the THC tags returning the offset relative to the original XML document
	calculateOffset: function(offset, node) {
			var sibling;
			if (THCTagCore.isTHCTag(node)) {
				//alert(node.nodeName + " is a THCTag");
				sibling = node.previousSibling;
				//alert("Sibling: " + sibling);
				if (!sibling) {
					var parent = node.parentNode;
					if (!parent) {
						return 0;
					}
					return getPreviousSiblingNodeWithSameName(parent);
				}
				if (THCTagCore.isTHCTag(sibling)) {
					//alert(sibling.nodeName + " is a THCTag");
					return this.calculateOffset(offset, sibling);
				} else if (THCTagCore.isTextNode(sibling)) {
					//alert(sibling.nodeName + " is a Text Node")
					offset = offset + sibling.length;
					//alert("offset = " + offset);
					return this.calculateOffset(offset, sibling);
				} else if (THCTagCore.isElementNode(sibling)) {
					//alert(sibling.nodeName + " is an Element");
					return this.getPreviousSiblingNodeWithSameName(sibling);
				}
			} else if (THCTagCore.isTextNode(node)) {
				//alert(node.nodeName + " is a Text Node");
				sibling = node.previousSibling;
				//alert("sibling: " + !sibling);
				if (!sibling) {
					return offset;
				}
				if (THCTagCore.isTHCTag(sibling)) {
					//alert(sibling.nodeName + " is a THCTag");
					var thcSibling = sibling.previousSibling;
					//alert("thcSibling: " + !thcSibling);
					if (!thcSibling) {
						return offset;
					}
					if (THCTagCore.isTextNode(thcSibling)) {
						//alert(thcSibling.nodeName + " is a TextNode");
						offset = offset + thcSibling.length;
						//alert("offset = " + offset);
						return this.calculateOffset(offset, thcSibling);
					} else if (THCTagCore.isTHCTag(thcSibling)) {
						return this.calculateOffset(offset, thcSibling);
					} else if (THCTagCore.isElementNode(thcSibling)) {
						return offset;
					} 
				} else if (THCTagCore.isElementNode(sibling) || THCTagCore.isCommentNode(sibling)) {
					//alert(sibling.nodeName + " is an Element");
					return offset;
				} else if (THCTagCore.isTextNode(sibling)) {
					/*
					 * This shold not happen in theory, but in practice it happens after the DOM has been manipulated.
					 */
					offset = offset + sibling.length;
					return this.calculateOffset(offset, sibling);
				}
			} else if (THCTagCore.isElementNode(node)) {
				//alert(node.nodeName + " is an Element");
				var children = node.childNodes;
				var childOffset;
				if (offset==0) {
					childOffset = 0;
					return offset;
				} else {
					childOffset = offset-1;
				}
				var selectedChild = children[childOffset];
				//alert("selected child: " + selectedChild);
				return this.getElementOffset(selectedChild, offset);
			}
	},
	
	getElementOffset: function(node, offset) {
		//alert("getting correct offset. Node: " + node.nodeName + " off: " + offset);
		var parent = node.parentNode;
		var children = parent.childNodes;
		var count = 0;
		var thctagfound = false;
		for (var i = 0; i< offset; i++) {
			var child = children[i];
			if (!THCTagCore.isTHCTag(child)) {
				count++;
			} else {
				var prev = child.previousSibling;
				var next = child.nextSibling;
				if (thctagfound) {
					if (THCTagCore.isTextNode(next)) {
						count--;
						thctagfound = false;
					} else if (!THCTagCore.isTHCTag(next)) {
						thctagfound = false;
					}
				}
				if (prev && next) {
					if (THCTagCore.isTextNode(prev) && THCTagCore.isTextNode(next)) {
						count--;
					} else if (THCTagCore.isTextNode(prev) && THCTagCore.isTHCTag(next)) {
						thctagfound = true;
					}
				}
			}
			//alert("Child: " + child.nodeName + " count: " + count);
		}
		return count;
	},

    getXPointerString: function(startUrl, startXPath, startOffset, endXPath, endOffset) {
        return startUrl + '#' + THCTagCore.XPath.getXPointerRanges(startXPath, startOffset, endXPath, endOffset);
    },
    
    getXPointerRanges: function(startXPath, startOffset, endXPath, endOffset) {
    	return "xpointer(start-point(string-range(" + startXPath + ",''," + startOffset + "))"
        + "/range-to(string-range(" + endXPath + ",''," + endOffset + ")))";
    },
    


    // get XPath from element
    // if a div with name='tag_name' is found, return relative XPath
    getXPath: function(e) {
        return this.getXPathAcc(e, null);
    },

   // getXPath with accumulator
    getXPathAcc: function(e, acc) {
        if (!e) {
            // return XPath
            return acc;
        } else {
            // get node name
            var nodeName = this.getNodeName(e);

            	// if tag_name is found
                if (THCTagCore.isTHCContent(e)) {
                    var nodeId = e.getAttribute('about');
                    var tagName = 'about';
                    if (nodeId==null) {
                    	nodeId = e.getAttribute('id');
                    	tagName='id';
                    }
                    if (acc != null)
                        return "//DIV[@" + tagName + "='" + nodeId + "']/" + acc;
                    else
                        return "//DIV[@" + tagName + "='" + nodeId + "']";
                }

                // if BODY tag is found
                if (nodeName == "BODY" || nodeName == "HTML") {
                    if (acc != null)
                        return "//BODY/" + acc;
                    else
                        return "//BODY";
                }
            

            // set new accumulator value (remove text() item from xpath)
            var childNumber = this.getPreviousSiblingNodeWithSameName(e);

            if (acc != null)
                acc = nodeName + "[" + childNumber + "]/" + acc;
            else
                acc = nodeName + "[" + childNumber + "]";

            // recursive call
            return this.getXPathAcc(e.parentNode, acc);
        }
    },

    getPreviousSiblingNodeWithSameName: function(e) {
        var tag_name = e.nodeName;
        return this.getPreviousSiblingNodeWithSameNameAcc(e, tag_name, 1);
    },

    getPreviousSiblingNodeWithSameNameAcc: function(e, tag_name, counter) {
        
        // get previous sibling node
        var psNode = e.previousSibling;
        
        // if there is a previous sibling node
        if (!psNode) {
            // return counter
            return counter;
        } else {
        	if (tag_name=="#text") {
        		
        		/*
         		* NOTE: We noticed a wrong behavior in mozilla. After having manipulated the DOM, sometimes the previousSibling of a text node returns an otehr text node with emty content.
         		* Here we detect when this happens and ignore the false sibling....
         		*/ 
        		if ((e.nodeName != null) && (psNode.nodeName != null) && (e.nodeName == tag_name) && (psNode.nodeName == tag_name)) {
        			return this.getPreviousSiblingNodeWithSameNameAcc(psNode, tag_name, counter);
        		}
        		
        		if (THCTagCore.isTHCTag(psNode)) {
        				var thcTagSibling = psNode.previousSibling; 
        				if (thcTagSibling && THCTagCore.isTextNode(thcTagSibling)) {
        					return this.getPreviousSiblingNodeWithSameNameAcc(thcTagSibling, tag_name, counter);	
        				}
        		} else if ((psNode.nodeName == tag_name)) {
        			counter++;
        		}
        			
        	} else {
        	// previous sibling node has same name of current node, increment counter
            	if ((psNode.nodeName == tag_name) && (!THCTagCore.isTHCTag(psNode))) {
               		counter++;
            	}	
        	}
            

            // recursive call
            return this.getPreviousSiblingNodeWithSameNameAcc(psNode, tag_name, counter);
        }
    },

    // get node name
    getNodeName: function(e) {
        switch (e.nodeType) {
            case Node.ELEMENT_NODE:
                return e.nodeName;
                break;
            case Node.TEXT_NODE:
                return "text()";
                break;
        }
    }
};

var selectionCounter = 0;
var currentTHCTagId;

THCTagCore.Annotate = {
 
	  wrapIntersectedElement: function (ele, range, selectionId) {
        // if has children                  
        if (ele.childNodes && ele.childNodes.length > 0) {
          // then do range traveling
          for (var i = (ele.childNodes.length-1); i >= 0 && ele.childNodes[i]; i--) {
            THCTagCore.Annotate.wrapIntersectedElement( ele.childNodes[i], range, selectionId );
          }
        } else if ( THCTagCore.Annotate.isValidTextNode( range, ele ) ) {
        	if (ele.tagName == "IMG" || ele.tagName=='img') {
        		THCTagCore.Annotate.wrapNode( range, ele, selectionId, 'table' );
        	} else {
        		THCTagCore.Annotate.wrapNode( range, ele, selectionId, 'span' );	
        	}
          	
        }
      },

      wrapNode: function (range, ele, selectionId, tagName) {
        var subRange = document.createRange ? document.createRange() : document.selection.createRange();
    
        // select correct sub-range
        if (ele == range.startContainer || ele == range.endContainer) {
          subRange.setStart(ele, (ele == range.startContainer) ? range.startOffset : 0);
          subRange.setEnd(ele, (ele == range.endContainer) ? range.endOffset : ele.length);
        } 
        else {
            subRange.selectNode(ele);
        }
        // then wrap sub-range
        if (ele.tagName=="IMG" || ele.tagName=="img") {
        	subRange.surroundContents( THCTagCore.Annotate.createNewImageWrapper(selectionId, tagName) );
        } else {
        	subRange.surroundContents( THCTagCore.Annotate.createNewTextWrapper(selectionId, tagName) );	
        }
        
        subRange.detach();
      },

	  createNewTextWrapper: function (selectionId, tagName) {
        var element = document.createElement(tagName);
        
        element.setAttribute('style','background-color: #FF0; padding: 1px;');
        
        element.setAttribute('id', selectionId + '-' + selectionCounter);
        selectionCounter++;
        return element;
      },
      
      createNewImageWrapper: function (selectionId, tagName) {
        var element = document.createElement(tagName);
        element.setAttribute('style','background-color: #FF0; padding: 3px; border: 1px solid; border-color: #CCCCCC; width: 10px');
        element.setAttribute('id', selectionId + '-' + selectionCounter);
        
        selectionCounter++;
        return element;
      },


      isValidTextNode: function ( range, ele ) {
		var isText = ele.nodeType==Node.TEXT_NODE;
        // check if ele is empty or not
        var isNotEmpty = false;
        if (isText) {
        	var isNotIrrelevant = THCTagUtil.replaceAll(
												THCTagUtil.replaceAll(ele.textContent, '\n', '')
											, ' ', '') != '';
        	isNotEmpty = ele.data && (ele.data.replace(/ /g, '') != '') && isNotIrrelevant; 
        } else if (ele.tagName=='IMG' || ele.tagName=='img') {
        		isNotEmpty = true;	
        }
        
        // check if ele is in the range or not
        var isInRange = THCTagCore.Annotate.intersectsNode(range, ele);
        var isNotTHC = !THCTagCore.isTHCTag(ele);
        return isNotEmpty && isInRange && isNotTHC;

      },

      intersectsNode: function(range, node) {
	      var nodeRange = node.ownerDocument.createRange();
	      try {
	        nodeRange.selectNode(node);
	      } catch (e) {
	        nodeRange.selectNodeContents(node);
	      }
	      return range.compareBoundaryPoints(Range.END_TO_START || 3, nodeRange) == -1 && range.compareBoundaryPoints(Range.START_TO_END || 1, nodeRange) == 1;
     },


	 deselectFragment: function() {

         // currentTHCTagId is the hash used as id for this THCTag .. global var?!
    	
    	if (currentTHCTagId && currentTHCTagId!=null && currentTHCTagId!='') {
    		
    		var selectionId = currentTHCTagId + "-sel";
    		var deselectId = currentTHCTagId + "-desel";
    		var xpointer = jthc.getXpointerFromHash(currentTHCTagId);
    	
	    	for (var i = selectionCounter-1; i >= 0; i--) {
	    		var selectionNode = document.getElementById(selectionId + '-' + i);
	    		if (selectionNode == null) {
	    			continue;
	    		}
	    		var range = document.createRange();
	   			range.setStart(selectionNode, 0);
	   			range.setEnd(selectionNode, selectionNode.childNodes.length);
	    		var contents = range.cloneContents();
	    		selectionNode.parentNode.insertBefore(contents, selectionNode);
	    		selectionNode.parentNode.removeChild(selectionNode);
	    	}
	    	
	    	var deselectNode = document.getElementById(deselectId);
	    	deselectNode.parentNode.removeChild(deselectNode);
			
			selectionCounter = 0;
			currentTHCTagId = null;
			THCTag.hide();
	    	THCTag.addByXPointer(xpointer);
    		
    	}
    	
    	 
    },

    // get previous sibling node text length
    getPreviousSiblingNodeTextLenght: function(e) {
        return this.getPreviousSiblingNodeTextLenghtAcc(e, 0);
    },

    // get previous sibling node text length
    getPreviousSiblingNodeTextLenghtAcc: function(e, currentLength) {
        // get previous sibling node
        var psNode = e.previousSibling;
        
        // if there is a previous sibling node
        if (!psNode) {
            // return current lenght
            return currentLength;
        } else {
            if(psNode.nodeType == Node.TEXT_NODE) {
                currentLength += psNode.nodeValue.length;
            }

            return this.getPreviousSiblingNodeTextLenghtAcc(psNode, currentLength);
        }
    },

	validateXPath: function(xpath) {
		var result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var node = result.snapshotItem(0);
		if (node==null) return false;
		return true;
	},

	isDistinctTextNode: function(nodeList, index, backward) {
		var txtNode = nodeList[index];
		if (txtNode.nodeType!=Node.TEXT_NODE || (txtNode.nodeType==Node.TEXT_NODE && txtNode.textContent=='')) return false;
		var ignorePrevious = false;
		var isDistinct = true;
		
		var prev;
		if (backward) {
			if (index>0) {
				prev = nodeList[index-1];	
			}
		} else {
			prev = nodeList[index+1];
		}
		
		if (prev!=null && prev.nodeType==Node.TEXT_NODE && prev.textContent!='') {
			return false;
		}
		
		if (backward) {
			for(var i=index-1; i>0; i--) {
				var prevNode = nodeList[i];
				if (ignorePrevious && prevNode.nodeType==Node.TEXT_NODE && prevNode.textContent!='') {
					isDistinct = false;
					break;
				}
				if (THCTagCore.isTHCTag(prevNode) || ( prevNode.nodeType==Node.TEXT_NODE && prevNode.textContent=='')) {
					ignorePrevious = true;
				} else {
					isDistict = true;
					break;
				}
			}	
		} else {
			for(var i=index+1; i<nodeList.length; i++) {
				var prevNode = nodeList[i];
				var prevprevNode = nodeList[i+1];
				if (ignorePrevious && prevNode.nodeType==Node.TEXT_NODE && prevNode.textContent!='') {
					isDistinct = false;
					break;
				}
				if (THCTagCore.isTHCTag(prevNode) || ( prevNode.nodeType==Node.TEXT_NODE && prevNode.textContent=='') ) {
					ignorePrevious = true;
				} else {
					isDistict = true;
					break;
				}
			}
		}
		
		return isDistinct;
	},

	addTHCTagsFromXPath: function(startUrl, startXPath, startOffset, endXPath, endOffset) {
		
		var elementName = THCTagCore.XPath.getXPointerString(startUrl, startXPath, startOffset, endXPath, endOffset);
		
		//Get the start element and offset with respect to the actual document (it might contain THC tags as well as empty text nodes caused by previous DOM manipulations)
		var start = this.matchXpath(startXPath, startOffset);
		
		//Add the THC anchor if not already present
		var anchorId = THCTagCore.XPath.getXPointerString(startUrl, startXPath, startOffset, endXPath, endOffset) + "-anchor";
		var anchor = document.getElementById(anchorId);
		if (anchor==null) {
			var startParentElement = start[0].parentNode;
	        anchor = this.selectionAnchor(startUrl, startXPath, startOffset, endXPath, endOffset);
	        startParentElement.insertBefore(anchor, start[0]);	
		}
		
	
		//Get the end element and offset with respect to the actual document (it might contain THC tags as well as empty text nodes caused by previous DOM manipulations)
		var end = this.matchXpath(endXPath, endOffset);
	
		var button = this.selectionLinkButton(elementName, startUrl, startXPath, startOffset, endXPath, endOffset);
		
		//Add the THC button	
		
		if (end[0].nodeType==Node.TEXT_NODE) {
			var oldText = end[0].textContent;
			
			var firstPart = document.createTextNode(oldText.substring(0, end[1]));
	        var secondPart = button;
	        var thirdPart = document.createTextNode(oldText.slice(end[1]));
	        var endParentElement = end[0].parentNode;
	        endParentElement.replaceChild(thirdPart, end[0]);
	        endParentElement.insertBefore(secondPart, thirdPart);
	        endParentElement.insertBefore(firstPart, secondPart);
	        
	        //clean empty text nodes
	        if (thirdPart.textContent=='') {
	        	endParentElement.removeChild(thirdPart);
	        }
	        if (firstPart.textContent=='') {
	        	endParentElement.removeChild(firstPart);
	        }	
		} else {
			var parent = end[0].parentNode;
			if (parent!=null) {
				var next = end[0].nextSibling;
				if (next!=null) {
					parent.insertBefore(button, next);
				} else {
					parent.appendChild(button);
				}
			}
		}

	},
	
	removeSelectionLinkButton: function(icon) {
		var next = icon.nextSibling;
		var prev = icon.previousSibling;
		var parentNode = icon.parentNode; 
		if (next!=null && prev!=null && next.nodeType==Node.TEXT_NODE && prev.nodeType==Node.TEXT_NODE) {
			prev.textContent = prev.textContent + next.textContent;
			parentNode.removeChild(next); 
		}
		
		parentNode.removeChild(icon);
	},
	
	matchXpath: function(xpath, offset) {
		var splittedXpathArray = THCTagCore.XPathTranslator.splitXPath(xpath);
		var matchingElement = null;
		var matchingOffset = null;
		
		for(var i=0; i<splittedXpathArray.length; i++) {
			
			var element = splittedXpathArray[i];
			var elementName = element[0];
			var elementOffset = element[1];
			
			if (elementName=="") {
				continue;
			}
			
			if (matchingElement!=null) {
				
				var children = matchingElement.childNodes;
				
				if (elementName!="text()") {
					var cont = 0;
					for(var index=0; index<children.length; index++) {
						var child = children[index];
						if (child.tagName==elementName && !THCTagCore.isTHCTag(child)) {
							cont++;
						} 
						if (cont==elementOffset) {
							matchingElement = child;
							break;
						}
					}	
				} else {
					var cont = 0;
					for(var index=0; index<children.length; index++) {
						var child = children[index];
						if (child.nodeType!=Node.TEXT_NODE) {
							continue;
						}
						if (this.isDistinctTextNode(children, index, true)) {
							cont++;
						}
						if (cont==elementOffset) {
							matchingElement = child;
							break;
						}
					}
				}
				
			}
			var prefix = elementName.substring(0,5);
			if (prefix=="DIV[@") {
				var id = THCTagCore.XPathTranslator.getContentIDFromXPath(xpath);
				var matchingElements = THCTagUtil.getElementsByAttribute(document.body, "div", "about", id);
				//There should be only one!
				if (matchingElements.length == 1) {
					matchingElement = matchingElements[0];
				} else {
					// SUPPORT FOR THC VERSION 2.0
					matchingElement = document.getElementById(id);
					if (matchingElement==null) {
						matchingElement = document.getElementById(id + CONTENT_ID_SUFFIX);
					}
				}
				
			} else if (elementName=="BODY") {
				matchingElement = document.getElementsByTagName(elementName)[0];
			}
			
		}
		
		if (matchingElement.nodeType==Node.TEXT_NODE) {
			var node = matchingElement;
			while (matchingOffset==null) {
				if (node.nodeType!=Node.TEXT_NODE || (node.nodeType==Node.TEXT_NODE && node.textContent=='')) {
					if (node)
					node = node.nextSibling;
					continue;
				}
				if (node.textContent.length >= offset) {
					matchingOffset = offset;
					matchingElement = node;
				} else {
					offset = offset - node.textContent.length;
					node = node.nextSibling;
				}	
			}
			
		} else {
			/*
			 * If the matching element is a DOM element instead of a text node.
			 * It means that the offset indicates the nth element inside the matching element.
			 */
			var cont = 0;
			var children = matchingElement.childNodes;
			for(var index=0; index<children.length; index++) {
				var child = children[index];
				if ( !( THCTagCore.isTHCTag(child) || (child.nodeType==Node.TEXT_NODE && !this.isDistinctTextNode(children,index, false)) ) ) {
					cont++;
				} 
				
				if (cont==offset) {
					matchingElement = child;
					break;
				}
			}	
			if (matchingElement.nodeType==Node.TEXT_NODE) {
				matchingOffset = matchingElement.textContent.length;
			} else {
				
				matchingOffset = 1;
			}
		}
		
		return [matchingElement, matchingOffset];
	},
	

	// deselectionLinkbutton: function(deselectId) {
	deselectionLinkbutton: function(xpointer) {
		
		// TODO: move the suffixes into some sort of parameters
		
		var deselect = document.createElement('a'),
		    hash = jthc.getHashFromXpointer(xpointer),
		    deselectId = hash + "-desel";
		    
		deselect.setAttribute('id', deselectId);
		deselect.setAttribute('href',document.location);
		deselect.setAttribute("style", "position:static;");
		deselect.setAttribute("about", xpointer);
		
		var icon = document.createElement('img');
		icon.setAttribute("src","css/icons/cross.png");
		// icon.setAttribute('onclick', "THCTagCore.Annotate.deselectFragment(); return false;");
		icon.setAttribute("style", "cursor:pointer; border:none;padding:1px;margin:0px;position:static;display:inline;");
		icon.setAttribute("alt", "[close]");
		icon.setAttribute("class", thcButtonName);
		deselect.appendChild(icon);
		
		return deselect;
	},

    selectionLinkButton: function(elementName, startUrl, startXPath, startOffset, endXPath, endOffset) {

        var hash = jthc.getHashFromXpointer(elementName);
        
        var selectionLink = document.createElement("a");

        selectionLink.setAttribute("about", elementName);

        // selectionLink.setAttribute("id", elementName);
        selectionLink.setAttribute("id", hash);
        selectionLink.setAttribute("class", thcButtonName);
        selectionLink.setAttribute("href", "#");
        selectionLink.setAttribute("style", "position:static;");

        // TODO: change this and move js stuff on the A node, or even better a live() event
        // selectionLink.setAttribute("onClick", "THCTag.show(\"" + startUrl + "\", \"" + startXPath + "\", " + startOffset + ", \"" + endXPath + "\" , " + endOffset + "); return false;");
        
        var imageIcon = document.createElement("img");
        
        //imageIcon.setAttribute("id", elementName + "-icon");
        imageIcon.setAttribute("id", hash + "-icon");
        imageIcon.setAttribute("class", thcButtonName);
        imageIcon.setAttribute("src", "css/baloon.png");
        imageIcon.setAttribute("alt", "[note]");
        imageIcon.setAttribute("style", "cursor:pointer; border:none;padding:2px;margin:0px;position:static;display:inline;");
        selectionLink.appendChild(imageIcon);

        return selectionLink;
    },

	selectionAnchor: function(startUrl, startXPath, startOffset, endXPath, endOffset) {
		
		var xpointer = THCTagCore.XPath.getXPointerString(startUrl, startXPath, startOffset, endXPath, endOffset),
		    hash = jthc.getHashFromXpointer(xpointer),
            // anchorId = THCTagUtil.decodeUrl(xpointer + "-anchor");
            anchorId = THCTagUtil.decodeUrl(hash + "-anchor");
		
		var anchor = document.getElementById(anchorId);
		
		if (!anchor) {
			anchor = document.createElement("a");	
			anchor.setAttribute("class", thcAnchorClass);
			anchor.setAttribute("name", THCTagCore.XPath.getXPointerRanges(startXPath, startOffset, endXPath, endOffset));
			anchor.setAttribute('id', anchorId);
		}
		
		return anchor;
	},

    getTextNodeFromOffset: function(e, offset) {
        var currentNodeIndex = 1;

        var textNodes = document.evaluate(e + "/text()", document, null, XPathResult.ANY_TYPE, null);
        var currentNode = textNodes.iterateNext();

        while (currentNode) {
            if (currentNode.textContent) {
                offset -= currentNode.textContent.length;
            }

            if (offset > 0) {
                currentNode = textNodes.iterateNext();
                currentNodeIndex += 1;
            } else {
                currentNode = null;
            }
        }

        return "text()[" + currentNodeIndex + "]";
    },

    getLocalOffset: function(e, offset) {
        var currentOffset = offset;

        var textNodes = document.evaluate(e + "/child::text()", document, null, XPathResult.ANY_TYPE, null);
        var currentNode = textNodes.iterateNext();

        while (currentNode) {
            if (currentNode.textContent) {
                offset -= currentNode.nodeValue.length;
            }

            if (offset > 0) {
                currentNode = textNodes.iterateNext();
                currentOffset = offset;
            } else {
                currentNode = null;
            }
        }

        return currentOffset;
    },

    getTextFromXPath: function(e) {
        var textNodes = document.evaluate(e, document, null, XPathResult.STRING_TYPE, null);
        return textNodes.stringValue;
    },

    showNoteById: function(startXPath, startOffset, endXPath, endOffset) {

		var contentId = THCTagCore.XPathTranslator.getContentIDFromXPath(startXPath);
		var xpointer = THCTagCore.XPath.getXPointerString(contentId, startXPath, startOffset, endXPath, endOffset);

		var start = this.matchXpath(startXPath, startOffset);
		var end = this.matchXpath(endXPath, endOffset);

		var startNode = start[0];
		var endNode = end[0];
		var newStartOffset = start[1];
		var newEndOffset = end[1];

        // create selection range
        var highlightRange = document.createRange();

        if (startNode.nodeType != Node.ELEMENT_NODE)
            highlightRange.setStart(startNode, newStartOffset);
        else
            highlightRange.setStartBefore(startNode);

        if (endNode.nodeType != Node.ELEMENT_NODE)
            highlightRange.setEnd(endNode, newEndOffset);
        else
            highlightRange.setEndAfter(endNode);
            

		if (INLINE_HIGHLIGHTING) {
		
		/*
 		 * Content is highlighted inline
 		 */		
 		 
 		 	var hash = jthc.getHashFromXpointer(xpointer),
 		 	    selectionId = THCTagUtil.decodeUrl(hash + "-sel");
 		 
 		 	THCTagCore.Annotate.wrapIntersectedElement(highlightRange.commonAncestorContainer, highlightRange, selectionId);
 		 
            /*
 		 	var xpointerId = THCTagUtil.decodeUrl(xpointer);
 		 	var anchorId = THCTagUtil.decodeUrl(xpointerId + "-anchor");
 		 	var deselectId = THCTagUtil.decodeUrl(xpointer + "-desel");
 		 	*/

 		 	var hash = jthc.getHashFromXpointer(THCTagUtil.decodeUrl(xpointer)),
 		 	    xpointerId = hash,
 		 	    anchorId = hash + "-anchor",
 		 	    deselectId = hash + "-desel";
            
			icon = document.getElementById(xpointerId);

			// var deselect = THCTagCore.Annotate.deselectionLinkbutton(deselectId);
			var deselect = THCTagCore.Annotate.deselectionLinkbutton(xpointer);
			
			var parentNode = icon.parentNode;
			
			//removing the initial buttons...
 		 	//this.removeSelectionLinkButton(icon);
 		 	
 		 	parentNode.replaceChild(deselect, icon);
			//anchor.parentNode.removeChild(anchor);
			
			currentTHCTagId = xpointerId;
			
		} else {
			
		 /*
 		 * Content is displaied in a overlay popup
 		 */

	        // clone current content
	        var clonedRange = highlightRange.cloneContents();
	
			highlightNode.innerHTML = '';
	
	        // append cloned content
	        highlightNode.appendChild(clonedRange);
	
	        // append content for dialog
	        document.getElementsByTagName("body").item(0).appendChild(highlightNode);
	        document.getElementsByTagName("body").item(0).appendChild(overlay);
	
	
			//Alternative to JQuery
	
			THCTagCore.Annotate.removeAllSelectionLinkButtons(highlightNode);
			
			highlightNode.innerHTML = '' + 
					'<div class="thc_title">' + 
						'<table><tr><td width="100%">' + 
							'Page fragment' +
						'</td><td width="2">' +
							'<a style="cursor:pointer;" onClick="THCTagCore.Annotate.hideLightBox();' + 
													'THCTag.hide(); return false;">' + 
								'<b>close[x]</b>' + 
							'</a>' + 
						'</td></tr></table>' +
					'</div>' + 
					'<div class="thc_dialog_content">' + 
						highlightNode.innerHTML + 
					'</div>';
					
			THCTagCore.Annotate.showLightBox();

		}

		
    },


/**
 * Creates the DOM elements that will display fragment selected by the user
 */
	createLightBoxElements: function(highlightNode, overlay) {
		
		// create highlight node
        highlightNode.setAttribute("id", "THCHighlightNote");
		highlightNode.setAttribute("class", "thc_white_content");
		highlightNode.setAttribute("stye", "display:none;");

		overlay.setAttribute('class', 'thc_black_overlay');
		overlay.setAttribute("id", "THCOverlay");
		overlay.setAttribute("style", "display:none;");
		
	},
	
	showLightBox: function() {
		highlightNode.setAttribute('style',"display:block;");
		overlay.setAttribute('style',"display:block;");
	},
	
	hideLightBox: function() {
		highlightNode.setAttribute('style',"display:none;");
		overlay.setAttribute('style',"display:none;");
		highlightNode.innerHTML = '';
	},

	removeAllSelectionLinkButtons: function(element) {
		
		var children = element.childNodes;
		for (var i = 0; i < children.length; i++) {
			if (children[i].tagName) {
				if (THCTagCore.isTHCTag(children[i])) {
					element.removeChild(children[i]);
				} else {
					THCTagCore.Annotate.removeAllSelectionLinkButtons(children[i]);	
				}
			} 
		}
	},

};

THCTagCore.XPathTranslator = {
    // translate XPath to current document version
    tranlsateXPathToCurrent: function(xpath, offset) {

        // if text() is not present, result is equal to xpath
        var result = [];  // xpath;
        var resultOffset = offset;

        // split xpath string
        var splittedXPathArray = this.splitXPath(xpath);
        
        

        // for each item of xpath
        for(var counter = 0; counter < splittedXPathArray.length; counter++) {
            // get current item
            var currentItem = splittedXPathArray[counter];
			
            // work on current item
            if(currentItem[0] != "") {
            
	        	
	            //currentItem[0] = THCTagUtil.decodeUrl(currentItem[0]);
            
                // create current xpath
                var partialXPath = result.join("/");

                if(currentItem[0].substring(0,4) != "text") {
                	
                    if(currentItem[1].toString() != "NaN") {
                    	
                        currentItem[1] = this.getCurrentOffset(partialXPath, currentItem[0], currentItem[1]);
                        
                    }
                } else {
                	
                    var textNode = this.getCurrentTextOffset(partialXPath, currentItem[1], offset);
                    currentItem[0] = "text()";
                    currentItem[1] = textNode[0];
                    resultOffset = textNode[1];
                }
            }
			
            // add current item to result array
            if(currentItem[1].toString() != "NaN")
                result.push(currentItem[0] + "[" + currentItem[1] + "]");
            else
                result.push(currentItem[0]);
                
        }

        return [result.join("/"), resultOffset];

    },

    // translate XPath to original document version
    tranlsateXPathToOriginal: function(xpath, offset, shiftPolicy) {
        // if text() is not present, result is equal to xpath
        var result = [];
        var resultOffset = offset;

        // split xpath string
        var splittedXPathArray = this.splitXPath(xpath);

        // for each item of xpath
        for(var counter = 0; counter < splittedXPathArray.length; counter++) {
            // get current item
			
            var currentItem = splittedXPathArray[counter];
			//alert("currentItem: " + currentItem);
            // work on current item
            if(currentItem[0] != "") {
				
				currentItem[0] = THCTagUtil.decodeUrl(currentItem[0]);
				
	
                // create current xpath
                var partialXPath = result.join("/");

                if(currentItem[0].substring(0,4) != "text") {
                    if(currentItem[1].toString() != "NaN") {
                        currentItem[1] = this.getOriginalOffset(partialXPath, currentItem[0], currentItem[1]);
                    }
                } else {
                    var textNode = this.getOriginalTextOffset(partialXPath, currentItem[1], offset);
                    currentItem[0] = "text()";
                    currentItem[1] = textNode[0];
                    resultOffset = textNode[1];
                }
            }

            // add current item to result array
            if(currentItem[1].toString() != "NaN")
                result.push(currentItem[0] + "[" + currentItem[1] + "]");
            else
                result.push(currentItem[0]);

            // check if currentItem is a THCNote
            if((currentItem[0] == "SPAN") || ((currentItem[0] == "IMG"))) {
            	
                var partialResult = result.join("/");
                partialResult = document.evaluate(partialResult, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                partialResult = partialResult.snapshotItem(0);
				//alert("elemento sospetto: " + partialResult);
                if(THCTagCore.isTHCTag(partialResult)) {
                	//alert("is a THC tag");
                    // remove current item from result array
                    result.pop();
                    var newNode = null;

                    if(shiftPolicy == 'backward') {
                        newNode = this.shiftBackwardNode(partialResult);
                    }
                    if(shiftPolicy == 'forward') {
                        newNode = this.shiftForwardNode(partialResult);
                    }

                    if(newNode[0].substring(0,4) != "text") {
                        splittedXPathArray[counter][0] = newNode[0];
                        splittedXPathArray[counter][1] = newNode[1];
                    } else {
                        splittedXPathArray[counter][0] = newNode[0];
                        splittedXPathArray[counter][1] = this.getOffset(newNode[0]);
                        offset = newNode[1];
                    }

                    counter--;
                }
                
            }
            
        }

        return [result.join("/"), resultOffset];

    },

    shiftBackwardNode: function(e) {
        var result = [];
        // get privous node
        var backwardNode = e.previousSibling;

        if(backwardNode.nodeType == Node.ELEMENT_NODE) {
            result[0] = backwardNode.nodeName;
            result[1] = THCTagCore.XPath.getPreviousSiblingNodeWithSameName(backwardNode);
        }

        if(backwardNode.nodeType == Node.TEXT_NODE) {
            result[0] = "text()[" + THCTagCore.XPath.getPreviousSiblingNodeWithSameName(backwardNode) + "]";
            result[1] = backwardNode.nodeValue.length;
        }

        return result;
    },

    shiftForwardNode: function(e) {
        var result = [];
        // get next node
        var forwardNode = e.nextSibling;

        if(forwardNode.nodeType == Node.ELEMENT_NODE) {
            result[0] = forwardNode.nodeName;
            result[1] = THCTagCore.XPath.getPreviousSiblingNodeWithSameName(forwardNode);
        }

        if(forwardNode.nodeType == Node.TEXT_NODE) {
            result[0] = "text()[" + THCTagCore.XPath.getPreviousSiblingNodeWithSameName(forwardNode) + "]";
            result[1] = 0;
        }

        return result;
    },

    // split XPath in an array of elements
    splitXPath: function(xpath) {
        // split xpath string
        var contentpart = THCTagCore.XPathTranslator.getContentXPath(xpath);
        var result = new Array();
        if (contentpart != null && contentpart!= '') {
        	xpath = xpath.replace(contentpart, '');
        	result = xpath.split("/");
        	result[2] = contentpart;
        } else {
        	result = xpath.split("/");
        }
        // for each item in result
        for(var counter = 0; counter < result.length; counter++) {
            // get element name
            var element = this.getElement(result[counter]);
            // if element is not "", then get current offset
            var offset = Number.NaN;
            if(element != "")
                offset = this.getOffset(result[counter]);

            // if offset is NaN, element must be equal to original
            if(offset.toString() == "NaN")
                element = result[counter];

            result[counter] = [element, offset];
        }

        return result;
    },
    
    /* Extract the part of hte XPath relative to the initial THCTag DIVs*/   
    getContentXPath: function(xpath) {
        
        var index = xpath.indexOf('DIV[@about=\'');
        var tagName = "about";
        if (index == -1) {
        	index = xpath.indexOf('DIV[@id=\'');
        	tagName = "id";
        }
    	if (index == -1) {
    		return null;
    	} else if (index<3) {
    		var contentstart = index;
    		var contentlength = xpath.indexOf('\']/') - contentstart;
    		var contentlength = xpath.indexOf('\']') - contentstart + 2;
    		var piece = xpath.substr(contentstart, contentlength);
    		return piece;
    	}
    	return null;
    },
    
    getContentIDFromXPath: function(xpath) {
    	var contentUrl;
    	var index = xpath.indexOf('DIV[@about=\'');
    	var tagName = "about";
    	if (index == -1) {
        	index = xpath.indexOf('DIV[@id=\'');
        	tagName = "id"
        }
    	if (index == -1) {
    		contentUrl = window.location.href;
        	if (contentUrl.indexOf('#') != -1) {
        		contentUrl = contentUrl.split('#')[0];
        	}
    	} else if (index<3) {
    		
    		var urlstart = index + 7 + tagName.length;
    		var urllength;
    		if (xpath.indexOf('_text\']') != -1) {
    			urllength = xpath.indexOf('_text\']') - urlstart;	
    		} else {
    			urllength = xpath.indexOf('\']') - urlstart;
    		}
    		
    		var piece = xpath.substr(urlstart, urllength);
    		
    		contentUrl = piece;
    	} 
    	return contentUrl;
    },

    // get node form splitted xpath element
    // DIV[2] => DIV
    getElement: function(value) {
        if(value.indexOf("[") > 0)
            return value.substring(0, value.indexOf("["));
        else
            return value;

    },

    // get offset form splitted xpath element
    // DIV[2] => 2
    // DIV => 1
    // DIV[@id = 'abc'] => NaN
    getOffset: function(value) {
        if(value.indexOf("[") > 0) {
            var offset = value.substring(value.indexOf("[") + 1, value.indexOf("]"));

            return parseInt(offset);
        } else
            return 1;
    },

    // return the original offset for element node
    getOriginalOffset: function(xpath, name, offset) {

        var currentOffset = offset;
        var resultOffset = offset;

        var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for(var counter = 0; counter < nodes.snapshotLength; counter++) {
            var node = nodes.snapshotItem(counter);

            if(node.nodeName == name) {
                currentOffset--;
            }

            
                if(THCTagCore.isTHCTag(node)) {
                    if(resultOffset > 1)
                        resultOffset--;
                }
           

            if(currentOffset == 0)
                return resultOffset;

        }

        return null;
    },

    // return the original offset for element node
    getCurrentOffset: function(xpath, name, offset) {

        var currentOffset = offset;
        var resultOffset = offset;

        var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for(var counter = 0; counter < nodes.snapshotLength; counter++) {
        	
            var node = nodes.snapshotItem(counter);


            if(node.nodeName == name) {
                currentOffset--;
                if(THCTagCore.isTHCTag(node)) {
                    currentOffset++;
                    resultOffset++;
                }
            }


            if(currentOffset == 0)
                return resultOffset;
               
        }

        return null;
    },

    // return the original offset for text node
    getOriginalTextOffset: function(xpath, offset, textOffset) {
    	
        var currentOffset = offset;
        var resultOffset = offset;
        var resultTextOffset = 0;

        var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for(var counter = 0; counter < nodes.snapshotLength; counter++) {
            var node = nodes.snapshotItem(counter);

            if(currentOffset > 0) {
                if(node.nodeName.toString() == "#text") {
                    currentOffset--;
                    resultTextOffset += node.nodeValue.length;

                } else { 
                	if(!THCTagCore.isTHCTag(node)) {
                        resultTextOffset = 0;
               	    }

                    if(THCTagCore.isTHCTag(node) && node.nodeName!="A") {
                        resultOffset--;
                    }
              
            	}
            }	

            if(currentOffset == 0) {
                resultTextOffset += textOffset - node.nodeValue.length;
                currentOffset--;
            }
        }

		
        return [resultOffset, resultTextOffset];
    },

	/*
	getCurrentOffset: function(xpath, offset, textOffset) {
		var resultOffset = 0;
		var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for(var counter = 0; counter < nodes.snapshotLength; counter++) {
			node = nodes.snapshotItem(counter);
			if (node.nodeType==Node.TEXT_NODE) {
				resultOffset++;
			} 
		}
		
		
	},
	*/

    // return the original offset for text node
    getCurrentTextOffset: function(xpath, offset, textOffset) {
        var currentOffset = offset;
        var resultOffset = 1;
        var resultTextOffset = textOffset;

        var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        var node = null;
        var endElementNode = 0;
        for(var counter = 0; counter < nodes.snapshotLength; counter++) {
            node = nodes.snapshotItem(counter);
            // get the first element after text node selected
            if(currentOffset > 1) {

                // we need to decrement currentOffset
                
                    // Isn't it a THCNote tag?
                    if(!THCTagCore.isTHCTag(node)) {
                        // if current node have a previous text node
                        var prevNode = nodes.snapshotItem(counter - 1);
                        
                        if((counter > 0) && (prevNode.nodeType == Node.TEXT_NODE) && node.textContent!='')
                            currentOffset--;
                    }
                
                if(node.nodeType == Node.TEXT_NODE){
                    resultOffset++;
                }

            }

            if(currentOffset == 1){
                endElementNode = counter;
                currentOffset--;
                counter = nodes.snapshotLength;
            }
        }

        node = null;
        var startElementNode = 0;
        // get the last element before actual text node selected
        for(var inverseCounter = endElementNode; inverseCounter > startElementNode; inverseCounter--) {
            node = nodes.snapshotItem(inverseCounter);

                if(!THCTagCore.isTHCTag(node))
                    startElementNode = inverseCounter;
        }

        // get real text node offset and text offset
        node = null;
        var result = [resultOffset, resultTextOffset];
        for(var forwardCounter = startElementNode; forwardCounter < nodes.snapshotLength; forwardCounter++) {
            node = nodes.snapshotItem(forwardCounter);

            if(node.nodeType == Node.TEXT_NODE){

                if(resultTextOffset > node.nodeValue.length) {
                    resultOffset++;
                    resultTextOffset -= node.nodeValue.length;
                } else {
                    result = [resultOffset, resultTextOffset];
                    forwardCounter = nodes.snapshotLength;
                }
            }

        }

        return result;

    },

    getNodeAt: function(xpath, offset) {
        
        //alert("getting node at:" + xpath + " - " + offset);
        
        var currentOffset 
        if (offset==0) {
        	currentOffset = 1;
        } else {
        	currentOffset = offset;	
        }
        var resultName = null;
        var resultOffset = 0;

        var nodes = document.evaluate(xpath + "/node()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        var node = null;
        var thctagfound = false;
        for(var counterName = 0; counterName < nodes.snapshotLength; counterName++) {
            node = nodes.snapshotItem(counterName);
			
			if (!THCTagCore.isTHCTag(node)) {
				currentOffset--;
			} else {
				var prev = node.previousSibling;
				var next = node.nextSibling;
				if (thctagfound) {
					if (THCTagCore.isTextNode(next)) {
						currentOffset++;
						thctagfound = false;
					} else if (!THCTagCore.isTHCTag(next)) {
						thctagfound = false;
					}
				}
				//alert("THCTag found. prev: " + prev.nodeName + " next: " + next.nodeName);
				if (prev && next) {
					if (THCTagCore.isTextNode(prev) && THCTagCore.isTextNode(next)) {
						currentOffset++;
					} else if (THCTagCore.isTextNode(prev) && THCTagCore.isTHCTag(next)) {
						thctagfound = true;
					}
				}
			}
            
			//alert("Evaluation result: " + node.nodeName + " offset: " + currentOffset);
			
            if(currentOffset == 0) {
            	resultName = node.nodeName;
            	break;
            }
                
        }

		//alert("Result Name: " + resultName);

		//alert("Final evaluation result: " + resultName);
		
        node = null; 
        
        //If the offset is zero, it means the selection starts a the beginning of a element tag....      
        if (offset==0) {
        	offset++;
        }
        //alert("calculating offset...");
        for(var counterOffset = 0; counterOffset < nodes.snapshotLength; counterOffset++) {
            node = nodes.snapshotItem(counterOffset);
            
            //alert("correct name?: " + (node.nodeName == resultName) );
            //alert(" regular tag?: " + (!THCTagCore.isTHCTag(node)) );
            
            // increment resultOffset if current node name is equal to resultName
            if(node.nodeName == resultName && !THCTagCore.isTHCTag(node)) {
                resultOffset++;
            }
            //alert("node: " + node.nodeName + " resultOffset: " + resultOffset);

        }

        // translate #text to text()
        if(resultName == "#text")
            resultName = "text()";

		//alert("resultName: " + resultName + " resultOffset:" + resultOffset);

        return [resultName, resultOffset];
    }

};

THCTagUtil = {


	getElementsByAttribute: function(oElm, strTagName, strAttributeName, strAttributeValue){
	    var arrElements = (strTagName == "*" && document.all)? document.all : oElm.getElementsByTagName(strTagName);
	    var arrReturnElements = new Array();
	    var oAttributeValue = (typeof strAttributeValue != "undefined")? new RegExp("(^|\\s)" + strAttributeValue + "(\\s|$)") : null;
	    var oCurrent;
	    var oAttribute;
	    for(var i=0; i<arrElements.length; i++){
	        oCurrent = arrElements[i];
	        oAttribute = oCurrent.getAttribute(strAttributeName);
	        if(typeof oAttribute == "string" && oAttribute.length > 0){
	            if(typeof strAttributeValue == "undefined" || (oAttributeValue && oAttributeValue.test(oAttribute))){
	                arrReturnElements.push(oCurrent);
	            }
	        }
	    }
    	return arrReturnElements;
	},

	//takes a range and extracts a readable description of its content. Text is preserved, while imgs are replaced by a "Image" tag.
	extractContentFromRange: function (range) {
		var content = '';
		if (range == null) return content;
		var clone = range.cloneContents();
		THCTagCore.Annotate.removeAllSelectionLinkButtons(clone);
		var children = clone.childNodes;
		for(var index=0; index<children.length; index++) {
			content += THCTagUtil.extractContentFromNode(children[index]);
		}
		return content;
	},

	extractContentFromNode: function (node) {
			//alert("Type: " + node.nodeType + " Content: " + node.textContent + " TagName: " + node.tagName);
			var content = '';
			var type = node.nodeType;
			if (type==Node.ELEMENT_NODE) {
				if (node.tagName == "IMG") {
					var src = node.getAttribute("src");
					var idx = src.lastIndexOf("/");
					if (idx != -1) {
						src = src.substr(idx + 1, src.length - idx);
					}
					content += "[image: " + src + "]";
				} else {

					var children = node.childNodes;
					for(var index=0; index<children.length; index++) {
						content += THCTagUtil.extractContentFromNode(children[index]);
					}	
				}
				
			} else if (type != Node.COMMENT_NODE){
				var nodecontent = node.textContent;
				//alert(nodecontent);
					if (nodecontent!=undefined) {
						content += nodecontent;
					}
			}
			return content;
	},

	encodeUrl: function (url) {
		return THCTagUtil.replaceAll(escape(url), '/', '%2F');
	},
	
	decodeUrl: function (encodedUrl) {
		return THCTagUtil.replaceAll(unescape(encodedUrl), '%2F', '/')
	},

	replaceAll: function (OldString,FindString,ReplaceString) {
  		var SearchIndex = 0;
  		var NewString = ""; 
  		while (OldString.indexOf(FindString,SearchIndex) != -1)    {
    		NewString += OldString.substring(SearchIndex,OldString.indexOf(FindString,SearchIndex));
    		NewString += ReplaceString;
    		SearchIndex = (OldString.indexOf(FindString,SearchIndex) + FindString.length);         
 		}
  		NewString += OldString.substring(SearchIndex,OldString.length);
  		return NewString;
	},



	/* The following methods notifies events to an external application via XML messages written in the status bar of the browser */

    writeMessage: function(action, xpointers, contents) {
    	
        var xmlResult = '';
		xmlResult += '<thctag_message action=\'' + action + '\'>\n';
		
		if (xpointers != null && xpointers.length > 0) {		

			for(var i = 0; i < xpointers.length; i++) {
				var xpointer = xpointers[i];
				var content = '';
				if (contents != null && contents != '') {
					content = contents[i];
				}
       	     	xmlResult += this.getNotifyMessage(xpointer, content);
			}

		} else {
			xmlResult += this.getNotifyMessage('');
		}

		xmlResult += '</thctag_message>';
		
		if (THC_DEBUG_MODE) {
			alert(xmlResult);
		}
		
        window.status = xmlResult;
    },


    getNotifyMessage: function(xpointer, content) {

        var xmlResult = '';

        xmlResult += '<browser_selection>\n';
        if (xpointer!='') {
        	xmlResult += '<xpointer>' + xpointer + '</xpointer>\n';
        	xmlResult += '<content_uri>' + THCTagCore.getUrlFromXPointer(xpointer) + '</content_uri>';
        }
		xmlResult += '<content>' + Encoder.htmlEncode(content,false) + '</content>';
		//xmlResult += '<content>' + content + '</content>';

        xmlResult += '<page_url>' + THCTagUtil.removeFragmentFromUrl(window.location.href) + '</page_url>\n';
        xmlResult += '</browser_selection>\n';

        return xmlResult;
    },
    
    removeFragmentFromUrl: function(url) {
    	if (url.indexOf('#') != -1) {
    		return url.split('#')[0];
    	}
    	return url;
    }
};



Encoder = {

	// When encoding do we convert characters into html or numerical entities
	EncodeType : "numerical",  // entity OR numerical

	isEmpty : function(val){
		if(val){
			return ((val===null) || val.length==0 || /^\s+$/.test(val));
		}else{
			return true;
		}
	},
	// Convert HTML entities into numerical entities
	HTML2Numerical : function(s){
		var arr1 = new Array('&nbsp;','&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&shy;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&agrave;','&aacute;','&acirc;','&atilde;','&Auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&Ouml;','&times;','&oslash;','&ugrave;','&uacute;','&ucirc;','&Uuml;','&yacute;','&thorn;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&quot;','&amp;','&lt;','&gt;','&oelig;','&oelig;','&scaron;','&scaron;','&yuml;','&circ;','&tilde;','&ensp;','&emsp;','&thinsp;','&zwnj;','&zwj;','&lrm;','&rlm;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&fnof;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&thetasym;','&upsih;','&piv;','&bull;','&hellip;','&prime;','&prime;','&oline;','&frasl;','&weierp;','&image;','&real;','&trade;','&alefsym;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&crarr;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&forall;','&part;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&sum;','&minus;','&lowast;','&radic;','&prop;','&infin;','&ang;','&and;','&or;','&cap;','&cup;','&int;','&there4;','&sim;','&cong;','&asymp;','&ne;','&equiv;','&le;','&ge;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&loz;','&spades;','&clubs;','&hearts;','&diams;');
		var arr2 = new Array('&#160;','&#161;','&#162;','&#163;','&#164;','&#165;','&#166;','&#167;','&#168;','&#169;','&#170;','&#171;','&#172;','&#173;','&#174;','&#175;','&#176;','&#177;','&#178;','&#179;','&#180;','&#181;','&#182;','&#183;','&#184;','&#185;','&#186;','&#187;','&#188;','&#189;','&#190;','&#191;','&#192;','&#193;','&#194;','&#195;','&#196;','&#197;','&#198;','&#199;','&#200;','&#201;','&#202;','&#203;','&#204;','&#205;','&#206;','&#207;','&#208;','&#209;','&#210;','&#211;','&#212;','&#213;','&#214;','&#215;','&#216;','&#217;','&#218;','&#219;','&#220;','&#221;','&#222;','&#223;','&#224;','&#225;','&#226;','&#227;','&#228;','&#229;','&#230;','&#231;','&#232;','&#233;','&#234;','&#235;','&#236;','&#237;','&#238;','&#239;','&#240;','&#241;','&#242;','&#243;','&#244;','&#245;','&#246;','&#247;','&#248;','&#249;','&#250;','&#251;','&#252;','&#253;','&#254;','&#255;','&#34;','&#38;','&#60;','&#62;','&#338;','&#339;','&#352;','&#353;','&#376;','&#710;','&#732;','&#8194;','&#8195;','&#8201;','&#8204;','&#8205;','&#8206;','&#8207;','&#8211;','&#8212;','&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;','&#8224;','&#8225;','&#8240;','&#8249;','&#8250;','&#8364;','&#402;','&#913;','&#914;','&#915;','&#916;','&#917;','&#918;','&#919;','&#920;','&#921;','&#922;','&#923;','&#924;','&#925;','&#926;','&#927;','&#928;','&#929;','&#931;','&#932;','&#933;','&#934;','&#935;','&#936;','&#937;','&#945;','&#946;','&#947;','&#948;','&#949;','&#950;','&#951;','&#952;','&#953;','&#954;','&#955;','&#956;','&#957;','&#958;','&#959;','&#960;','&#961;','&#962;','&#963;','&#964;','&#965;','&#966;','&#967;','&#968;','&#969;','&#977;','&#978;','&#982;','&#8226;','&#8230;','&#8242;','&#8243;','&#8254;','&#8260;','&#8472;','&#8465;','&#8476;','&#8482;','&#8501;','&#8592;','&#8593;','&#8594;','&#8595;','&#8596;','&#8629;','&#8656;','&#8657;','&#8658;','&#8659;','&#8660;','&#8704;','&#8706;','&#8707;','&#8709;','&#8711;','&#8712;','&#8713;','&#8715;','&#8719;','&#8721;','&#8722;','&#8727;','&#8730;','&#8733;','&#8734;','&#8736;','&#8743;','&#8744;','&#8745;','&#8746;','&#8747;','&#8756;','&#8764;','&#8773;','&#8776;','&#8800;','&#8801;','&#8804;','&#8805;','&#8834;','&#8835;','&#8836;','&#8838;','&#8839;','&#8853;','&#8855;','&#8869;','&#8901;','&#8968;','&#8969;','&#8970;','&#8971;','&#9001;','&#9002;','&#9674;','&#9824;','&#9827;','&#9829;','&#9830;');
		return this.swapArrayVals(s,arr1,arr2);
	},	

	// Convert Numerical entities into HTML entities
	NumericalToHTML : function(s){
		var arr1 = new Array('&#160;','&#161;','&#162;','&#163;','&#164;','&#165;','&#166;','&#167;','&#168;','&#169;','&#170;','&#171;','&#172;','&#173;','&#174;','&#175;','&#176;','&#177;','&#178;','&#179;','&#180;','&#181;','&#182;','&#183;','&#184;','&#185;','&#186;','&#187;','&#188;','&#189;','&#190;','&#191;','&#192;','&#193;','&#194;','&#195;','&#196;','&#197;','&#198;','&#199;','&#200;','&#201;','&#202;','&#203;','&#204;','&#205;','&#206;','&#207;','&#208;','&#209;','&#210;','&#211;','&#212;','&#213;','&#214;','&#215;','&#216;','&#217;','&#218;','&#219;','&#220;','&#221;','&#222;','&#223;','&#224;','&#225;','&#226;','&#227;','&#228;','&#229;','&#230;','&#231;','&#232;','&#233;','&#234;','&#235;','&#236;','&#237;','&#238;','&#239;','&#240;','&#241;','&#242;','&#243;','&#244;','&#245;','&#246;','&#247;','&#248;','&#249;','&#250;','&#251;','&#252;','&#253;','&#254;','&#255;','&#34;','&#38;','&#60;','&#62;','&#338;','&#339;','&#352;','&#353;','&#376;','&#710;','&#732;','&#8194;','&#8195;','&#8201;','&#8204;','&#8205;','&#8206;','&#8207;','&#8211;','&#8212;','&#8216;','&#8217;','&#8218;','&#8220;','&#8221;','&#8222;','&#8224;','&#8225;','&#8240;','&#8249;','&#8250;','&#8364;','&#402;','&#913;','&#914;','&#915;','&#916;','&#917;','&#918;','&#919;','&#920;','&#921;','&#922;','&#923;','&#924;','&#925;','&#926;','&#927;','&#928;','&#929;','&#931;','&#932;','&#933;','&#934;','&#935;','&#936;','&#937;','&#945;','&#946;','&#947;','&#948;','&#949;','&#950;','&#951;','&#952;','&#953;','&#954;','&#955;','&#956;','&#957;','&#958;','&#959;','&#960;','&#961;','&#962;','&#963;','&#964;','&#965;','&#966;','&#967;','&#968;','&#969;','&#977;','&#978;','&#982;','&#8226;','&#8230;','&#8242;','&#8243;','&#8254;','&#8260;','&#8472;','&#8465;','&#8476;','&#8482;','&#8501;','&#8592;','&#8593;','&#8594;','&#8595;','&#8596;','&#8629;','&#8656;','&#8657;','&#8658;','&#8659;','&#8660;','&#8704;','&#8706;','&#8707;','&#8709;','&#8711;','&#8712;','&#8713;','&#8715;','&#8719;','&#8721;','&#8722;','&#8727;','&#8730;','&#8733;','&#8734;','&#8736;','&#8743;','&#8744;','&#8745;','&#8746;','&#8747;','&#8756;','&#8764;','&#8773;','&#8776;','&#8800;','&#8801;','&#8804;','&#8805;','&#8834;','&#8835;','&#8836;','&#8838;','&#8839;','&#8853;','&#8855;','&#8869;','&#8901;','&#8968;','&#8969;','&#8970;','&#8971;','&#9001;','&#9002;','&#9674;','&#9824;','&#9827;','&#9829;','&#9830;');
		var arr2 = new Array('&nbsp;','&iexcl;','&cent;','&pound;','&curren;','&yen;','&brvbar;','&sect;','&uml;','&copy;','&ordf;','&laquo;','&not;','&shy;','&reg;','&macr;','&deg;','&plusmn;','&sup2;','&sup3;','&acute;','&micro;','&para;','&middot;','&cedil;','&sup1;','&ordm;','&raquo;','&frac14;','&frac12;','&frac34;','&iquest;','&agrave;','&aacute;','&acirc;','&atilde;','&Auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&Ouml;','&times;','&oslash;','&ugrave;','&uacute;','&ucirc;','&Uuml;','&yacute;','&thorn;','&szlig;','&agrave;','&aacute;','&acirc;','&atilde;','&auml;','&aring;','&aelig;','&ccedil;','&egrave;','&eacute;','&ecirc;','&euml;','&igrave;','&iacute;','&icirc;','&iuml;','&eth;','&ntilde;','&ograve;','&oacute;','&ocirc;','&otilde;','&ouml;','&divide;','&oslash;','&ugrave;','&uacute;','&ucirc;','&uuml;','&yacute;','&thorn;','&yuml;','&quot;','&amp;','&lt;','&gt;','&oelig;','&oelig;','&scaron;','&scaron;','&yuml;','&circ;','&tilde;','&ensp;','&emsp;','&thinsp;','&zwnj;','&zwj;','&lrm;','&rlm;','&ndash;','&mdash;','&lsquo;','&rsquo;','&sbquo;','&ldquo;','&rdquo;','&bdquo;','&dagger;','&dagger;','&permil;','&lsaquo;','&rsaquo;','&euro;','&fnof;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigmaf;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&thetasym;','&upsih;','&piv;','&bull;','&hellip;','&prime;','&prime;','&oline;','&frasl;','&weierp;','&image;','&real;','&trade;','&alefsym;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&crarr;','&larr;','&uarr;','&rarr;','&darr;','&harr;','&forall;','&part;','&exist;','&empty;','&nabla;','&isin;','&notin;','&ni;','&prod;','&sum;','&minus;','&lowast;','&radic;','&prop;','&infin;','&ang;','&and;','&or;','&cap;','&cup;','&int;','&there4;','&sim;','&cong;','&asymp;','&ne;','&equiv;','&le;','&ge;','&sub;','&sup;','&nsub;','&sube;','&supe;','&oplus;','&otimes;','&perp;','&sdot;','&lceil;','&rceil;','&lfloor;','&rfloor;','&lang;','&rang;','&loz;','&spades;','&clubs;','&hearts;','&diams;');
		return this.swapArrayVals(s,arr1,arr2);
	},


	// Numerically encodes all unicode characters
	numEncode : function(s){
		
		if(this.isEmpty(s)) return "";

		var e = "";
		for (var i = 0; i < s.length; i++)
		{
			var c = s.charAt(i);
			if (c < " " || c > "~")
			{
				c = "&#" + c.charCodeAt() + ";";
			}
			e += c;
		}
		return e;
	},
	
	// HTML Decode numerical and HTML entities back to original values
	htmlDecode : function(s){

		var c,m,d = s;
		
		if(this.isEmpty(d)) return "";

		// convert HTML entites back to numerical entites first
		d = this.HTML2Numerical(d);
		
		// look for numerical entities &#34;
		arr=d.match(/&#[0-9]{1,5};/g);
		
		// if no matches found in string then skip
		if(arr!=null){
			for(var x=0;x<arr.length;x++){
				m = arr[x];
				c = m.substring(2,m.length-1); //get numeric part which is refernce to unicode character
				// if its a valid number we can decode
				if(c >= -32768 && c <= 65535){
					// decode every single match within string
					d = d.replace(m, String.fromCharCode(c));
				}else{
					d = d.replace(m, ""); //invalid so replace with nada
				}
			}			
		}

		return d;
	},		

	// encode an input string into either numerical or HTML entities
	htmlEncode : function(s,dbl){
			
		if(this.isEmpty(s)) return "";

		// do we allow double encoding? E.g will &amp; be turned into &amp;amp;
		dbl = dbl | false; //default to prevent double encoding
		
		// if allowing double encoding we do ampersands first
		if(dbl){
			if(this.EncodeType=="numerical"){
				s = s.replace(/&/g, "&#38;");
			}else{
				s = s.replace(/&/g, "&amp;");
			}
		}

		// convert the xss chars to numerical entities ' " < >
		s = this.XSSEncode(s,false);
		
		if(this.EncodeType=="numerical" || !dbl){
			// Now call function that will convert any HTML entities to numerical codes
			s = this.HTML2Numerical(s);
		}

		// Now encode all chars above 127 e.g unicode
		s = this.numEncode(s);

		// now we know anything that needs to be encoded has been converted to numerical entities we
		// can encode any ampersands & that are not part of encoded entities
		// to handle the fact that I need to do a negative check and handle multiple ampersands &&&
		// I am going to use a placeholder

		// if we don't want double encoded entities we ignore the & in existing entities
		if(!dbl){
			s = s.replace(/&#/g,"##AMPHASH##");
		
			if(this.EncodeType=="numerical"){
				s = s.replace(/&/g, "&#38;");
			}else{
				s = s.replace(/&/g, "&amp;");
			}

			s = s.replace(/##AMPHASH##/g,"&#");
		}
		
		// replace any malformed entities
		s = s.replace(/&#\d*([^\d;]|$)/g, "$1");

		if(!dbl){
			// safety check to correct any double encoded &amp;
			s = this.correctEncoding(s);
		}

		// now do we need to convert our numerical encoded string into entities
		if(this.EncodeType=="entity"){
			s = this.NumericalToHTML(s);
		}

		return s;					
	},

	// Encodes the basic 4 characters used to malform HTML in XSS hacks
	XSSEncode : function(s,en){
		if(!this.isEmpty(s)){
			en = en || true;
			// do we convert to numerical or html entity?
			if(en){
				s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
				s = s.replace(/\"/g,"&quot;");
				s = s.replace(/</g,"&lt;");
				s = s.replace(/>/g,"&gt;");
			}else{
				s = s.replace(/\'/g,"&#39;"); //no HTML equivalent as &apos is not cross browser supported
				s = s.replace(/\"/g,"&#34;");
				s = s.replace(/</g,"&#60;");
				s = s.replace(/>/g,"&#62;");
			}
			return s;
		}else{
			return "";
		}
	},

	// returns true if a string contains html or numerical encoded entities
	hasEncoded : function(s){
		if(/&#[0-9]{1,5};/g.test(s)){
			return true;
		}else if(/&[A-Z]{2,6};/gi.test(s)){
			return true;
		}else{
			return false;
		}
	},

	// will remove any unicode characters
	stripUnicode : function(s){
		return s.replace(/[^\x20-\x7E]/g,"");
		
	},

	// corrects any double encoded &amp; entities e.g &amp;amp;
	correctEncoding : function(s){
		return s.replace(/(&amp;)(amp;)+/,"$1");
	},


	// Function to loop through an array swaping each item with the value from another array e.g swap HTML entities with Numericals
	swapArrayVals : function(s,arr1,arr2){
		if(this.isEmpty(s)) return "";
		var re;
		if(arr1 && arr2){
			//ShowDebug("in swapArrayVals arr1.length = " + arr1.length + " arr2.length = " + arr2.length)
			// array lengths must match
			if(arr1.length == arr2.length){
				for(var x=0,i=arr1.length;x<i;x++){
					re = new RegExp(arr1[x], 'g');
					s = s.replace(re,arr2[x]); //swap arr1 item with matching item from arr2	
				}
			}
		}
		return s;
	},

	inArray : function( item, arr ) {
		for ( var i = 0, x = arr.length; i < x; i++ ){
			if ( arr[i] === item ){
				return i;
			}
		}
		return -1;
	}

}



//Philospace support

var annotatedFragments = annotatedFragments;
if (annotatedFragments != undefined) {
	for(var counter = 0; counter < annotatedFragments.length; counter++) {
		THCTag.addByXPointer(annotatedFragments[counter]);
	}
}

var highlightNode = document.createElement("div");
var overlay = document.createElement("div");

THCTagCore.Annotate.createLightBoxElements(highlightNode, overlay);

var fragmentToBeSelected = fragmentToBeSelected;
if (fragmentToBeSelected != undefined) {
	THCTag.showByXPointer(fragmentToBeSelected);
}

THCTagCore.addClickImageHooks();

//THCTagUtil.writeMessage('completed','','');
