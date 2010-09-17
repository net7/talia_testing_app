/*
FLEXIP API
*/

function FJSAPI (varName, flashID, containerID, flWidth, flHeight, flVersion, commModURL, imageModURL, sideMenuModURL, flSkin) 
{
	this.name = varName;
	this.flashID = flashID;
	this.containerID = containerID;
	this.commModURL = ""; 			if(commModURL)this.commModURL = commModURL;
	this.imageModURL = ""; 			if(imageModURL)this.imageModURL = imageModURL;
	this.sideMenuModURL = ""; 		if(sideMenuModURL)this.sideMenuModURL = sideMenuModURL;
	this.flWidth = "100%"; 			if(flWidth)this.flWidth = flWidth;
	this.flHeight = "100%";			if(flHeight)this.flHeight = flHeight;
	this.flVersion = "9.0.0";		if(flVersion)this.flVersion = flVersion;
	this.flSkin = "default";		if(flSkin)this.flSkin = flSkin;
	this.flexipRef = null;
	this.logText = null;	

	this.openLogWindow = function ()
	{
		this.logWin = window.open("/flexip/scripts/jslog.html", "logWindow", 'width=500,height=400,x=10,y=10,scrollbars=yes,toolbar=no,status=no,resizable=no,location=no'); 
		this.logWin.moveTo(0,0);
		thisInstance = this;
		this.logWin.onload = function(){thisInstance.logText = thisInstance.logWin.document.getElementById("logconsole");}
		this.logWin.close = function(){thisInstance.logWindowClosedHandler();};
	};
		
	this.logWindowLoadedHandler = function(thisInstance)
	{
		thisInstance.logText = thisInstance.logWin.document.getElementById("logconsole");
	};
	
	this.logWindowClosedHandler = function()
	{
		this.logText = null;
		this.logWin = null;
	};
	
	
	
	this.log = function(level, message)
	{
		try
		{
			this.logText.innerHTML += "<p class='"+level.toLowerCase()+"'>"+message.replace(/\n/g,"<br />")+"</p>";
		}
		catch(err){}			
	};

	this.initialize = function()
	{
		var now = new Date();
		var flashvars = {};
		flashvars.initWithJSConsole = "true";
		flashvars.jsObject = this.name;
		flashvars.comm = this.commModURL;
		flashvars.imgh = this.imageModURL;
		flashvars.sidemenu = this.sideMenuModURL;
		flashvars.skin = this.flSkin;
		var params = {};
		params.quality = "best";
		params.allowfullscreen = "true";
		params.allowscriptaccess = "always";
		params.allownetworking = "all";
		var attributes = {};
		attributes.id = this.flashID;
		var thisInstance = this;
		swfobject.embedSWF(	"/flexip/Flexip_app.swf?anticache="+now.getTime(), 
							this.containerID, 
							this.flWidth,
							this.flHeight,
							this.flVersion,
							"", flashvars, params, attributes, function(e){thisInstance.swfObjectCallback(e)});
	}
	
  this.swfObjectCallback = function(e) {
    if(e.success) this.flexipRef = e.ref;		
  }
	
	/* + app base events + */
	this.skinLoaded = function()
	{
	}
	
	this.skinLoadError = function(e)
	{
	}
	
	this.moduleLoaded = function(moduleCode) {
  }
	
	this.allModulesLoaded = function()
	{
					
	}
	
	this.communicationModuleLoadError = function(e)
	{
	}
	
	this.sideMenuModuleLoadError = function(e)
	{
	}
	this.toolBarButtonClick = function(fCode)
	{
	}
	this.layerOperationPerformed = function(layerID,fCode, data) {}
	/* - app base events - */
	
	/* + comm module events + */
	this.commInterfaceSettingsLoadError = function(e)
	{
		
	}
	this.commInterfaceSettingsLoaded = function()
	{
		
	}
	this.commInterfaceSettingsParseStart = function()
	{
		
	}
	this.commInterfaceSettingsParseEnd = function()
	{
		
	}
	this.commInterfaceSettingsParseError = function(e)
	{
		
	}
	this.commDataLoaded = function()
	{
	}
	this.commDataLoadError = function(e)
	{
	}
	this.commDataParseStart = function()
	{
	}
	this.commDataParseEnd = function()
	{
	}
	this.commDataParseError = function(e)
	{
	}
	/* - comm module events - */
	/* + image module events + */
	this.imageModLoadError = function(e)
	{
	}
	this.imageMetadataLoaded = function(detailsObject)
	{
	}
	this.imageMetadataLoadError = function(e)
	{
	}
	this.imageLoaded = function()
	{
	}
	this.imageLoadError = function(e)
	{
	}
	/* - image module events - */
};