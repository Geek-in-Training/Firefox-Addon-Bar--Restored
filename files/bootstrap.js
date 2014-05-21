const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
var Application = Cc["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
Cu.import("resource:///modules/CustomizableUI.jsm");

/* require -- based off of Erik Vold's require.js */
(function(global) {
	var modules = {};
	global.require = function require(src, root) {
		if (modules[src])
			return modules[src];
		var scope = {require: global.require, Cu: global.Cu, Ci: global.Ci, Cc: global.Cc, exports: {}};
		var tools = {};
		root = root || __SCRIPT_URI_SPEC__;
		Cu.import("resource://gre/modules/Services.jsm", tools);
		var baseURI = tools.Services.io.newURI(root, null, null);
		var uri = tools.Services.io.newURI(src, null, baseURI);
		tools.Services.scriptloader.loadSubScript(uri.spec, scope);
		return modules[src] = scope.exports || scope.module.exports;
	};
})(this);

function loadIntoWindow(window) {
	if (window.document.documentElement.getAttribute("windowtype") !== "navigator:browser")
		return;
	try {
	require("content/addonbar.js").load(window);
	} catch (e) {
		window.console.log(e);
	}
}

function unloadFromWindow(window) {
	if (window.document.documentElement.getAttribute("windowtype") !== "navigator:browser")
		return;
		require("content/addonbar.js").unload(window);
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function onLoad() {
      domWindow.removeEventListener("load", onLoad, false);
      loadIntoWindow(domWindow);
    }, false);
  },

  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
	let version = (aData.oldVersion || "").replace(/[A-z]/g, "").split(".");
	if (aReason === ADDON_ENABLE || aReason === ADDON_INSTALL
			|| (aReason === ADDON_UPGRADE && parseInt(version[0]) <= 1 && parseInt(version[1]) <= 7) ) {
		Application.prefs.setValue("extensions.GiTAddonBar.remigrate", true);
	}
	require("content/preferences.js").load();
	require("content/statedui.js").load();
	require("modules/spacers.js").load();

	if (aReason === ADDON_UPGRADE) {
		if (parseInt(version[0]) <= 3 && parseInt(version[1]) <= 1) {
			CustomizableUI.createWidget({id: "GiT-addon-bar-spring", type: "button"});
			let placement = CustomizableUI.getPlacementOfWidget("GiT-addon-bar-spring");
			if (placement) {
				CustomizableUI.removeWidgetFromArea("GiT-addon-bar-spring");
				CustomizableUI.addWidgetToArea("spring", placement.area, placement.position);
			}
			CustomizableUI.destroyWidget("GiT-addon-bar-spring");
		}
	}

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  if (aReason == APP_SHUTDOWN)
    return;

	if (aReason === ADDON_DISABLE || aReason === ADDON_UNINSTALL) {
		Application.prefs.setValue("extensions.GiTAddonBar.undoRemigrate", true);
	}

	require("content/preferences.js").unload();
	require("content/statedui.js").unload();

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {
	if (!Application.prefs.has("extensions.GiTAddonBar.compactMode")) {
		let osString = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
		let compact = osString !== "Linux";
		Application.prefs.setValue("extensions.GiTAddonBar.compactMode", compact);
	}
}
function uninstall(aData, aReason) {

}
