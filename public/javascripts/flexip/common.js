if(!window.console || !window.console.firebug)
  console = {log: function(m) {}, warn: function(a) {}, error: function(a) {}};

$(document).ready(function () {
  if(pseudo_id = $("#image-annotations-pseudo_id").attr("value")) {
    $.get(config_url+pseudo_id, function(response) {
      if(response.error) alert("Error: "+response.error);
      else {
        config.modules.background = response.data.modules.background;
        config.toolbars_url = response.data.toolbars_url;
        config.layers_url = response.data.layers_url;
        config.image = response.data.image;
        loadFlexip();
      }
    }, 'json');
  }
});

var pseudo_id = null;
var flexip = null;
var myFjsApi = null;
var config = {
  image: null,
  toolbars_url: null,
  layers_url: null,
  modules: {
    comm: 'modules/comm/sicar/communication.swf',
    background: null,
    sideMenu: 'modules/SideMenuSicar.swf',
    skin: 'skins/default/skin.swf'
  }
};

function loadFlexip() {
  myFjsApi = new FJSAPI('myFjsApi',
                            'flexIP_0',
                            'flexip',
                            '100%',
                            '100%',
                            '9.0.0',
                            '/flexip/'+config.modules.comm+'?anticache='+(new Date()).getTime(),
                            '/flexip/'+config.modules.background+'?anticache='+(new Date()).getTime(),
                            '/flexip/'+config.modules.sideMenu+'?anticache='+(new Date()).getTime(),
                            '/flexip/'+config.modules.skin+'?anticache='+(new Date()).getTime());


  myFjsApi.allModulesLoaded = function() {
    this.flexipRef.commLoadInterfaceSettings(config.toolbars_url);
    this.flexipRef.imageLoadSource(config.image);
  }

  myFjsApi.imageLoaded = function() {
    this.flexipRef.commLoadData(config.layers_url);
  }

  myFjsApi.commDataParseEnd = function() {
    firefoxBugFix();
    this.flexipRef.messageBoxHide();
  }

  myFjsApi.toolBarButtonClick = toolBarButtonClick;
  myFjsApi.layerOperationPerformed = layerButtonClick;

/*
  myFjsApi.moduleLoaded = function(moduleCode) {console.warn("Module loaded: "+moduleCode)}
  myFjsApi.skinLoaded = function() {console.warn("Skin loaded");}
  myFjsApi.skinLoadError = function(e) {console.error("skinLoadError: "+e)}
  myFjsApi.communicationModuleLoadError = function(e) {console.error("communicationModuleLoadError: "+e)}
  myFjsApi.sideMenuModuleLoadError = function(e) {console.error("sideMenuModuleLoadError: "+e)}
  myFjsApi.commInterfaceSettingsLoadError = function(e) {console.error("commInterfaceSettingsLoadError: "+e)}
  myFjsApi.commDataLoadError = function(e) {console.error("commDataLoadError: "+e)}
  myFjsApi.commDataParseError = function(e) {console.error("commDataParseError: "+e)}
  myFjsApi.imageModLoadError = function(e) {console.error("imageModLoadError: "+e)}
  myFjsApi.imageMetadataLoadError = function(e) {console.error("imageMetadataLoadError: "+e)}
  myFjsApi.imageLoadError = function(e) {console.error("imageLoadError: "+e)}
*/

  myFjsApi.initialize();
  flexip = myFjsApi.flexipRef;
}

function firefoxBugFix() {
  var img = new Image();
  img.src = '/images/rails.png';
}
