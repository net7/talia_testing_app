$(function() {

    var eztipCode = 
            "<div class='eztipContainer' id='#eztipid#'>"+
            "   <div class='eztipBorderTop'>"+
            "       <b class='ez1'></b>"+
            "       <b class='ez2'></b>"+
            "       <b class='ez3'></b>"+
            "       <b class='ez4'></b>"+
            "   </div>"+
            "   <div class='eztipContent'>#eztipcontent#</div>"+
            "   <div class='eztipBorderBottom'>"+
            "       <b class='ez4'></b>"+
            "       <b class='ez3'></b>"+
            "       <b class='ez2'></b>"+
            "       <b class='ez1'></b>"+
            "   </div>"+
            "</div>";

        var eztipCode = 
                "<div class='eztipContainer' id='#eztipid#'>"+
                "   <div class='eztipLeft'></div>"+
                "   <div class='eztipContent'><br/>#eztipcontent#</div>"+
                "   <div class='eztipRight'></div>"+
                "</div>";

 	// eztip constructor
	$.eztip = function (opts) {
		
		// Global options for this boxView, right into the object
		this.options = $.extend({}, $.eztip.defaults, opts);
		this.init();

	}; // $.eztip()

	$.eztip.defaults = {

        // Time in ms before show and hide the tooltip
        showDelay: 750,
	    hideDelay: 500,
	    // Time in ms the user has to stay on the element to force it's hide action
	    forcedHideDelay: 5000,

        // Use some animation to show and hide the tooltip?
        // Duration time in ms of every animation
	    animateShow: true,
	    animateHide: true,
	    animationLength: 250,
        
	    // Offset to position the tip
	    leftOffset: 10,
	    topOffset: 10,
	    
	    // Length in pixels of the in-animation
	    introMoveExtent: 25,
	    
	    // For each content: show this tip this number of times, 0 for unlimited
	    showNumPerContent: 10,
	    
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

                var tipContent = (typeof($(this).data('tipContent')) == 'undefined') ? $(this).attr('title') : $(this).data('tipContent');

                // First time the user puts his mouse on this element: initialize the structures.
                // Must do this even if showNumPerContent=0, so the user can decide later to change
                // the number and see the tooltips
                if (typeof($(this).data('id')) == 'undefined') {

                    // No title > no tooltip
                    if (tipContent == "") 
                        return false;
                    
                    self.setContent(this, tipContent);

                    /*
                    // First time we see this, assign some infos
                    $(this).data('id', self.createHash());
                    $(this).data('hideTimer', null);
                    $(this).data('isActive', false);

                    // Fill the tooltip content with our element's title
                    // and reset it to avoid the browser's default tooltip
                    var code = eztipCode.replace('#eztipid#', $(this).data('id')).replace('#eztipcontent#', tipContent)
                    $(this).data('tipContent', tipContent);
                    $(this).data('code', code);
                    $(this).attr('title', '');
                    */
                    
                } // if typeof(id) == undefined


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
                        elWidth = $(el).width() + parseInt($(el).css('padding-left').replace('px','')) + parseInt($(el).css('padding-right').replace('px','')),
                        elHeight = $(el).height() + parseInt($(el).css('padding-top').replace('px','')) + parseInt($(el).css('padding-bottom').replace('px','')),
                        docHeight = $(document).height(),
                        docWidth = $(document).width(),
                        tipWidth = tip.width() + self.options.introMoveExtent + self.options.leftOffset,
                        tipHeight = tip.height()  + self.options.introMoveExtent + self.options.topOffset,
                        vAlign, hAlign;

                    var tipLeft = elPos.left + (elWidth/2) + self.options.leftOffset,
                        tipIntroLeft = tipLeft + self.options.introMoveExtent;
                    // Tip goes beyond the right border
                    if (tipLeft + tipWidth >= docWidth) {
                        hAlign = 'right';
                        tipLeft = tipLeft - tipWidth - 2*self.options.leftOffset;
                        tipIntroLeft = tipLeft - self.options.introMoveExtent;
                    } else {
                        hAlign = 'left';
                    }
                    
                    var tipTop = elPos.top + elHeight + self.options.topOffset,
                        tipIntroTop = tipTop + self.options.introMoveExtent;
                    // Tip goes beyond the bottom border
                    if (tipTop + tipHeight >= docHeight) {
                        vAlign = 'bottom';
                        tipTop = tipTop - elHeight - tipHeight - 2*self.options.topOffset;
                        tipIntroTop = tipTop - self.options.introMoveExtent;
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
                            if (self.options.introMoveExtent > 0) {
                                // Moving intro: put it a bit away and move it to its position
                                tip.css({opacity: 0.0, left: tipIntroLeft + 'px', top: tipIntroTop + 'px'}).show();
                                tip.animate({opacity: 1.0, left: tipLeft + 'px', top: tipTop + 'px'}, self.options.showLength);
                            } else 
                                tip.css({left: tipLeft + 'px', top: tipTop + 'px'}).hide().fadeIn(self.options.showLength);
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
                        tip.fadeOut(self.options.hideLength);
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
            if (typeof($(obj).data('id')) == 'undefined') {

                // First time we see this, assign some infos
                $(obj).data('id', self.createHash());
                $(obj).data('hideTimer', null);
                $(obj).data('isActive', false);

                /*
                // Fill the tooltip content with our element's title
                // and reset it to avoid the browser's default tooltip
                var code = eztipCode.replace('#eztipid#', $(this).data('id')).replace('#eztipcontent#', tipContent)
                $(this).data('tipContent', tipContent);
                $(this).data('code', code);
                $(this).attr('title', '');
                */
                
            }// if typeof(id) == undefined

        },

        setContent : function (obj, content) {
            var self = this;

            // No content > no tooltip
            if ($(obj).attr('title') == "" && typeof(content) == "undefined") 
                return false;
        
            self.initTooltip(obj);
            
            var code = eztipCode.replace('#eztipid#', $(obj).data('id')).replace('#eztipcontent#', content);
            $(obj).data('tipContent', content);
            $(obj).data('code', code);
            $(obj).attr('title', '');

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