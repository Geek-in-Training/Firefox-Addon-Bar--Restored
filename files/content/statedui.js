/* UI stuff that doesn't need to be loaded per window */
var backstage = Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("resource://services-common/stringbundle.js");

exports.load = function () {
	backstage.CustomizableUIInternal.registerArea("GiT-addon-bar", {
		legacy: false,
		type: CustomizableUI.TYPE_TOOLBAR,
		defaultPlacements: [
			"GiT-addon-bar-toggle-button",
			"spring",
			"GiT-status-bar-container"
		],
		defaultCollapsed: false
	}, true);

	let sb = new StringBundle("chrome://GiT-addonbar/locale/addonbar.properties");
	let toolbarName = sb.get("addonbar");
	let statusbarName = sb.get("statusbar");

	CustomizableUI.createWidget({
		id: "GiT-addon-bar-toggle-button",
		type: "button",
		label: toolbarName,
		tooltiptext: toolbarName,
		onCommand: function (e) {
			let addonbar = e.target.ownerDocument.getElementById("GiT-addon-bar");
			let window = e.target.ownerDocument.defaultView;
			if (addonbar.collapsed === false) {
				addonbar.collapsed = true;
			} else {
				addonbar.collapsed = false;
			}
		}
	});

	CustomizableUI.createWidget({
		id: "GiT-status-bar-container",
		type: "custom",
		onBuild: function (doc) {
			let item = doc.createElement("toolbaritem");
			item.id = "GiT-status-bar-container";
			item.setAttribute("removable", true);
			item.setAttribute("label", statusbarName);
			item.setAttribute("class", "panel-wide-item");
			item.setAttribute("closemenu", "none");
			let palette = doc.defaultView.gNavToolbox.palette;
			let statusbar = doc.getElementById("status-bar") ||
					palette.querySelector("status-bar");
			item.appendChild(statusbar);
			return item;
		}
	});
	CustomizableUI.addListener(specialListener);
}

exports.unload = function () {
	CustomizableUI.removeListener(specialListener);

	let listener = {
		onWidgetBeforeDOMChange: function (node, nextNode, container, removing) {
			if (removing) {
				if (node.id === "GiT-status-bar-container") {
					if (node.firstChild && node.firstChild.id === "status-bar") {
						try {
							node.ownerDocument.getElementById("addon-bar").appendChild(node.firstChild);
						} catch (e) { throw(e) }
					}
				}
			}
		}
	}

	CustomizableUI.addListener(listener);
	CustomizableUI.destroyWidget("GiT-addon-bar-toggle-button");
	CustomizableUI.destroyWidget("GiT-status-bar-container");
	CustomizableUI.unregisterArea("GiT-addon-bar");
	CustomizableUI.removeListener(listener);
}
