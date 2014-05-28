var window, document;
Cu.import("resource://services-common/stringbundle.js");

function getTBI(id) {
	try {
		return document.getElementById(id) || window.gNavToolbox.palette.querySelector("#" + id);
	} catch(e) {return null;}
}

exports = {
	load: function (win) {
		window = win;
		document = window.document;
		this.initAddonbar();
		this.initToggle();

		document.getElementById("addon-bar")._delegatingToolbar = "GiT-addon-bar";

		let appendStatusbar = window.CustomizableUI
				.getWidgetIdsInArea("GiT-addon-bar").slice(-1)[0] === "GiT-status-bar-container";
		if (window.Application.prefs.getValue("extensions.GiTAddonBar.remigrate", false)) {
			this.reMigrateItems("GiT-addon-bar");
			if (appendStatusbar) {
				window.CustomizableUI.addWidgetToArea("GiT-status-bar-container", "GiT-addon-bar");
			}
			window.Application.prefs.setValue("extensions.GiTAddonBar.remigrate", false);
		}
	},
	initAddonbar: function () {
		/* css */
		let css = document.createProcessingInstruction("xml-stylesheet",
			"href='chrome://GiT-addonbar/skin/addonbar.css' class='GiT-addonbar-style' type='text/css'"
		);

		document.insertBefore(css, document.firstChild);

		window.GiTAddonBarStylesheet = css;

		let sb = new StringBundle("chrome://GiT-addonbar/locale/addonbar.properties");

		let toolbarName = sb.get("addonbar");
		let accessKey = sb.get("accessKey");
		let collapsed = window.Application.prefs.getValue("extensions.GiTAddonBar.collapsed", false);
		let compact = window.Application.prefs.getValue("extensions.GiTAddonBar.compactMode", false);

		let addonbar = document.createElement("toolbar");
		addonbar.id = "GiT-addon-bar";
		addonbar.setAttribute("class", "toolbar-primary chromeclass-toolbar");
		addonbar.setAttribute("toolbarname", toolbarName);
		addonbar.setAttribute("hidden", "false");
		addonbar.setAttribute("context", "toolbar-context-menu");
		addonbar.setAttribute("toolboxid", "navigator-toolbox");
		addonbar.setAttribute("mode", "icons");
		addonbar.setAttribute("accesskey", accessKey);
		addonbar.setAttribute("iconsize", "small");
		addonbar.setAttribute("key", "GiT-addon-bar-togglekey");
		addonbar.setAttribute("customizable", "true");
		addonbar.setAttribute("collapsed", collapsed);
		addonbar.setAttribute("compact", compact);
		document.getElementById("browser-bottombox").appendChild(addonbar);

		window.addEventListener("unload", this.onUnload, false);
	},
	initToggle: function () {
		let key = document.createElement("key");
		let mainKeyset = document.getElementById("mainKeyset");

		key.id = "GiT-addon-bar-togglekey";
		key.setAttribute("key", "/");
		key.setAttribute("modifiers", "accel");
		key.setAttribute("oncommand", "void(0)");
		key.addEventListener("command", this.toggleVisibility, false);
		mainKeyset.insertBefore(key, mainKeyset.firstChild);
	},
	reMigrateItems: function (area) {
		let shim = document.getElementById("addon-bar");
		let items = shim.getMigratedItems();

		items.forEach(function (item) {
			let placement = window.CustomizableUI.getPlacementOfWidget(item);
			let exists = getTBI(item);
			if (exists && (!placement || placement.area !== area)) {
				try {
					window.CustomizableUI.addWidgetToArea(item, area);
				} catch (e) {
					window.console.log(e);
				}
			}
		});
	},
	onUnload: function (e) {
		let addonbar = document.getElementById("GiT-addon-bar");
		window.Application.prefs.setValue("extensions.GiTAddonBar.collapsed", addonbar.collapsed);
	},
	toggleVisibility: function (e) {
		var addonbar = e.target.ownerDocument.getElementById("GiT-addon-bar");
		if (addonbar.collapsed === false) {
			addonbar.collapsed = true;
		} else {
			addonbar.collapsed = false;
		}
	},
	unload: function (win) {
		window = win;
		document = window.document;

		if (window.Application.prefs.getValue("extensions.GiTAddonBar.undoRemigrate", false)) {
			this.reMigrateItems("nav-bar");
			window.Application.prefs.setValue("extensions.GiTAddonBar.undoRemigrate", false);
		}

		let key = document.getElementById("GiT-addon-bar-togglekey");
		let addonbar = document.getElementById("GiT-addon-bar");
		let shim = document.getElementById("addon-bar");

		shim.setAttribute("toolbar-delegate", "nav-bar");
		shim._delegatingToolbar = "nav-bar";
		key.removeEventListener("command", this.toggleVisibility);
		key.parentElement.removeChild(key);
		window.gNavToolbox.externalToolbars
			.splice(window.gNavToolbox.externalToolbars.indexOf(addonbar), 1);
		addonbar.parentElement.removeChild(addonbar);
		window.removeEventListener("unload", this.onUnload, false);

		window.GiTAddonBarStylesheet.parentNode
			.removeChild(window.GiTAddonBarStylesheet);

		delete window.GiTAddonBarStylesheet;
	}
};
