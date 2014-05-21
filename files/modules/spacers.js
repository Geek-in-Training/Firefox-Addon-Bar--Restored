const MODULE_VERSION = 1;
Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("resource://services-common/stringbundle.js");

var listener = {
	onWidgetBeforeDOMChange: function (node, nextNode, container, removing) {
		if (container.id === "PanelUI-contents") {
			if (node.id.search(/customizableui-special-(spring|separator)/) !== -1) {
				node.classList.add("panel-wide-item");
			}
		}
	}
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

exports.load = function () {
	let sb = new StringBundle("chrome://global/locale/customizeToolbar.properties");
	let springName = sb.get("springTitle");
	let spacerName = sb.get("spacerTitle");
	let separatorName = sb.get("separatorTitle");



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
	CustomizableUI.addListener(listener)
}

exports.unload = function () {
	CustomizableUI.removeListener(listener);
}
