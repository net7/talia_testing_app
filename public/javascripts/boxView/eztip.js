/*
Modificata da 	Giulio Andreini
Data 			08/07/2010
Da testare su IE
*/

$(function(){

	var eztipCode = 
            "<div class='eztipContainer' id='#eztipid#'>"+
                "   <div class='eztipContent'>#eztipcontent#</div>"+
			"</div>";


 	// eztip constructor
	$.eztip = function (opts) {
		
		// Global options for this boxView, right into the object
		this.options = $.extend({}, $.eztip.defaults, opts);
		this.init();

	}; // $.eztip()

	$.eztip.defaults = {

        // Time in ms before show and hide the tooltip
        showDelay: 2000, /// 0
	    hideDelay: 250, /// 0
	    
	    // Time in ms the user has to stay on the element to force it's hide action
	    forcedHideDelay: 4000, /// 5000

        // Use some animation to show and hide the tooltip?
        // Duration time in ms of every animation
	    animateShow: true, /// true
	    animateHide: true, /// true
	    animationLength: 250, /// 250 
        
	    // Offset to position the tip
	    leftOffset: 0,
	    topOffset: 0, /// 2

	    // If the stem is TOT pixel from the border, tell it here
	    horizStemOffset: 10, // calcolato considerando 5pixel di spostamento dello stem + la sua larghezza (10) diviso 2: 5 + (10/2)
	    vertStemOffset: 0,
	    
	    // Duration in ms of the show and hide animations
	    introDuration: 150, /// 500
	    hideDuration: 150, /// 500
	    
	    // For each content: show this tip this number of times, -1 for unlimited
	    showNumPerContent: -1,
	    
	    // default CSS selector of elements to be tipped
	    selector: '.eztip',

        // Internal used thingies
        tipCounter: []
        
    };
  
    $.eztip.prototype = {
  
        // true/false: enables/disables tip animations
        setAnimations : function (value) {
            var self = this;
            
            self.options.showLength = (value) ? self.options.animationLength : 0;
            self.options.hideLength = (value) ? self.options.animationLength : 0;
        },

        setShowNumPerContent : function(num) {
            var self = this;
            if (num<0) return false;
            self.options.showNumPerContent = num;
        },


        init : function() {
            
            var self = this;
            
            self.options.showLength = (self.options.animateShow) ? self.options.animationLength : 0;
            self.options.hideLength = (self.options.animateHide) ? self.options.animationLength : 0;
            
            // MouseOVER function
            $("" + this.options.selector).live('mouseenter', function() {

                var tipContent = ($(this).data('tipContent') == null) ? $(this).attr('title') : $(this).data('tipContent');

                // No title > no tooltip
                if (tipContent == "") 
                    return false;

                // First time the user puts his mouse on this element: initialize the structures.
                // Must do this even if showNumPerContent=0, so the user can decide later to change
                // the number and see the tooltips
                if ($(this).data('id') == null) {
                    self.firstSetContent(this, tipContent);
                } // id data(id) == null


                // 0 = dont show any tooltip, ever.
                if (self.options.showNumPerContent == 0) 
                    return false;
                    
                // Otherwise check the number and decide
                if (self.options.showNumPerContent > 0) {
                    // Havent seen this content yet: initialize the counter
                    if (typeof(self.options.tipCounter[tipContent]) == 'undefined')
                        self.options.tipCounter[tipContent] = 0;
                    // Counter already gone too far, dont show the tooltip
                    else if (self.options.tipCounter[tipContent]+1 > self.options.showNumPerContent) 
                        return false;
                }


                // Append the tooltip to the body
                if ($('#'+ $(this).data('id')).length == 0) {
                    $('body').append($(this).data('code'));
                    $('#'+ $(this).data('id')).hide();
                }
                 
                var tip = $('#' +$(this).data('id'));
                 
                            
                // Tooltip active: just kill hideTimer
                if ($(this).data('isActive') == true) {
                    
                    if ($(this).data('hideTimer') != null) {
                        clearTimeout($(this).data('hideTimer'));
                        $(this).data('hideTimer', null);
                        return false;
                    }

                // Tooltip inactive: set its position and start showTimer 
                } else {

                    var el = this;
					
                    // Every mouse over we refresh the tip position
                    var elPos = $(el).offset(),
                        // Calcola larghezza e altezza tenendo in considerazione i valori padding del CSS
                        elWidth = $(el).width() + parseInt($(el).css('padding-left').replace('px','')) + parseInt($(el).css('padding-right').replace('px','')),
                        elHeight = $(el).height() + parseInt($(el).css('padding-top').replace('px','')) + parseInt($(el).css('padding-bottom').replace('px','')),
                        docHeight = $(document).height(),
                        docWidth = $(document).width(),
                        // Calcola larghezza e altezza del tip tenendo in considerazione i valori padding del CSS
                        tipWidth = tip.width() + parseInt(tip.css('padding-left').replace('px','')) + parseInt(tip.css('padding-right').replace('px','')) + self.options.leftOffset,
                        tipHeight = tip.height() + parseInt(tip.css('padding-top').replace('px','')) + parseInt(tip.css('padding-bottom').replace('px','')) + self.options.topOffset,
                        totalHorizOffset = self.options.leftOffset + self.options.horizStemOffset,
                        totalVertOffset = self.options.topOffset + self.options.vertStemOffset,
                        vAlign, hAlign;

					// Logica di posizionamento del tip baloon
					// Posizione orizzontale...
                    // First we position it on the right side, if it it's too much, we correct
                    // the positions and put it on the other side
                    var tipLeft = elPos.left + (elWidth/2) - self.options.horizStemOffset; //  + totalHorizOffset - 5; // Da sistemare
                    // Tip goes beyond the right border
                    if (tipLeft + tipWidth >= docWidth) {
                        hAlign = 'right';
                        tipLeft = elPos.left + (elWidth/2) - tipWidth + self.options.horizStemOffset;
                    } else {
                        hAlign = 'left';
                    }
                    
                    // ..posizione verticale
                    var tipTop = elPos.top + elHeight + totalVertOffset;
                    // Tip goes beyond the bottom border
                    if (tipTop + tipHeight >= docHeight) {
                        vAlign = 'bottom';
                        tipTop = elPos.top - tipHeight;
                    } else {
                        vAlign = 'top';
                    }

                    // Update the css: positioning and class
                    // tip.css({left: tipLeft + 'px', top: tipTop + 'px'}).hide();
                    tip.removeClass("topleft topright bottomleft bottomright").addClass(vAlign+hAlign);
                    
                    $(el).data('showTimer', setTimeout(
                        function() {
                            self.options.tipCounter[tipContent]++;
                            $(el).data('showTimer', null);
                            $(el).data('isActive', true);
                           	tip.css({left: tipLeft + 'px', top: tipTop + 'px'}).hide().fadeIn(self.options.introDuration);
                            return false;
                        }, 
                        self.options.showDelay)
                    );
                }
                
                
                // Fadeout if the user stays on the element for too much
                $(el).data('hideTimer', setTimeout(
                    function() {
                        $(el).data('hideTimer', null);
                        $(el).data('isActive', false);
                        tip.fadeOut(self.options.hideDuration);
                        return false;
                    }, 
                    self.options.forcedHideDelay)
                );
                return false;
            }); // MouseOver function


            // MouseOUT function
            $("" + self.options.selector).live('mouseout', function() {

                var tip = $('#' +$(this).data('id')),
                    el = this;

                if ($(el).data('hideTimer')) 
                    clearTimeout($(el).data('hideTimer'));

                // Tooltip active: start the hideTimer
                if ($(el).data('isActive') == true) {
                    
                    $(el).data('hideTimer', setTimeout(
                        function() {
                            $(el).data('hideTimer', null);
                            $(el).data('isActive', false);
                            tip.fadeOut(self.options.hideLength);
                            return false;
                        }, 
                        self.options.hideDelay)
                    );

                // Tooltip inactive and mouseout? Stop everything!
                } else {
                    clearTimeout($(el).data('showTimer'));
                    clearTimeout($(el).data('hideTimer'));
                    $(el).data('showTimer', null);
                    $(el).data('showTimer', null);
                    $('.eztipContainer').remove();
                }

            }); // MouseOUT
            

        }, // init()


        initTooltip : function (obj) {
            
            var self = this;
            if ($(obj).data('id') == null) {

                // First time we see this, assign some infos
                $(obj).data('id', self.createHash());
                $(obj).data('hideTimer', null);
                $(obj).data('isActive', false);
                
            }// if typeof(id) == undefined

        },

        firstSetContent : function (obj, content) {
            var self = this;

            // No content > no tooltip: reset it!
            if ($(obj).attr('title') == "" && typeof(content) == "undefined") 
                return false;
        
            self.initTooltip(obj);
            self.setContent(obj, content);

            // Reset title, we know it!
            $(obj).attr('title', '');

        },

        setContent : function (obj, content) {
            var code = eztipCode.replace('#eztipid#', $(obj).data('id')).replace('#eztipcontent#', content);
            $(obj).data('code', code);
            $(obj).data('tipContent', content);
        },

        // Can be safely called from outside to replace the content of any tip
        replaceContent : function (obj, content) {
            // Set the content
            this.setContent(obj, content);
            $(obj).attr('title', content);
            
            // Tip already initialized: must replace the content in the proper div as well
            if ($(obj).data('id') != null) {
                $('#'+ $(obj).data('id')).detach();
                $('body').append($(obj).data('code'));
                $('#'+ $(obj).data('id')).hide();
            }
        },

    	// Generates an N items random hash code, to use as id
    	createHash : function(n) {
    		var i=0, str="";
			
    		if (typeof(n) == "undefined") n = 10;

    		while (i++ <= n) {
    			var rnd = Math.floor(Math.random()*36);
    			str += "abcdefghijklmnopqrstuvz0123456789".substring(rnd, rnd+1);
    		}
    		return str;
    	} // createHash()

    }; // $.eztip.prototype

});