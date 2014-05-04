var preferencesObserver = {
	prefs: null,
	startup: function () {
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.GiTAddonBar.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
	},

	shutdown: function () {
		this.prefs.removeObserver("", this);
	},

	observe: function (subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		if (data === "compactMode") {
			let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
							.getService(Ci.nsIWindowMediator);
			let windows = wm.getEnumerator("navigator:browser");
			while (windows.hasMoreElements()) {
				let window = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
				let addonbar = window.document.getElementById("GiT-addon-bar");
				addonbar.setAttribute("compact", this.prefs.getBoolPref("compactMode"));
			}
		}
	}
}

exports.load = function () {
	preferencesObserver.startup();
}
exports.unload = function () {
	preferencesObserver.shutdown();
}
