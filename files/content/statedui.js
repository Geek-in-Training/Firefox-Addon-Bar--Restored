/* UI stuff that doesn't need to be loaded per window */
var backstage = Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("resource://services-common/stringbundle.js");

var specialListener = {
	onWidgetAdded: function (id, area, position) {
		if (id.search(/^GiT-special-/) !== -1) {
			let widget = id.match(/\w+$/)[0];
			CustomizableUI.removeWidgetFromArea(id);
//			if (area !== "PanelUI-contents" || widget === "spacer")
				CustomizableUI.addWidgetToArea(widget, area, position);
		}
	},
	onWidgetBeforeDOMChange: function (node, nextNode, container, removing) {
		if (container.id === "PanelUI-contents") {
			if (node.id.search(/customizableui-special-(spring|separator)/) !== -1) {
				node.classList.add("panel-wide-item");
			}
		}
	}
}

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
	let builtinStrings = new StringBundle("chrome://global/locale/customizeToolbar.properties");
	let toolbarName = sb.get("addonbar");
	let springName = builtinStrings.get("springTitle");
	let spacerName = builtinStrings.get("spacerTitle");
	let separatorName = builtinStrings.get("separatorTitle");
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
		id: "GiT-special-spring",
		type: "custom",
		onBuild: function (doc) {
			let spring = doc.createElement("toolbarspring");
			spring.id = "GiT-special-spring";
			spring.setAttribute("flex", "1");
			spring.setAttribute("label", springName);
			spring.setAttribute("removable", "true");
			spring.classList.add("panel-wide-item");
			return spring;
		}
	});

	CustomizableUI.createWidget({
		id: "GiT-special-spacer",
		type: "custom",
		onBuild: function (doc) {
			let spacer = doc.createElement("toolbarspacer");
			spacer.id = "GiT-special-spacer";
			spacer.setAttribute("label", spacerName);
			spacer.setAttribute("removable", "true");
			return spacer;
		}
	});

	CustomizableUI.createWidget({
		id: "GiT-special-separator",
		type: "custom",
		onBuild: function (doc) {
			let separator = doc.createElement("toolbarseparator");
			separator.id = "GiT-special-separator";
			separator.setAttribute("label", separatorName);
			separator.setAttribute("removable", "true");
			separator.classList.add("panel-wide-item");
			return separator;
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
	CustomizableUI.destroyWidget("GiT-special-spring");
	CustomizableUI.destroyWidget("GiT-special-spacer");
	CustomizableUI.destroyWidget("GiT-special-separator");
	CustomizableUI.destroyWidget("GiT-status-bar-container");
	CustomizableUI.unregisterArea("GiT-addon-bar");
	CustomizableUI.removeListener(listener);
}
