const MODULE_VERSION = 1;
var backstage = Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("resource://app/modules/CustomizeMode.jsm");
Cu.import("resource://services-common/stringbundle.js");

var _populatePalette = CustomizeMode.prototype.populatePalette;
var _CustomizableUIInternal = backstage.CustomizableUIInternal;
var backstageReady = false;

var specialWidgetListener = {
	onWidgetBeforeDOMChange: function (node, nextNode, container, removing) {
		if (container.id === "PanelUI-contents") {
			if (node.id.search(/spring|separator/) !== -1) {
				node.classList.add("panel-wide-item");
			}
		}
	},
	onWidgetAfterDOMChange: function (node, nextNode, container, removing) {
		if (container.id === "PanelUI-contents") {
			if (removing && node.id.search(/^GiT-menu-special-widget/) !== -1) {
				CustomizableUI.destroyWidget(node.id);
			}
		}
	}
};
var spacersSB = new StringBundle("chrome://global/locale/customizeToolbar.properties");
var springName = spacersSB.get("springTitle");
var spacerName = spacersSB.get("spacerTitle");
var separatorName = spacersSB.get("separatorTitle");

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

function loadIntoWindow(window) {
	if (window.document.documentElement.getAttribute("windowtype") !== "navigator:browser")
		return;

	window.setTimeout(function () {
		var document = window.document;
		var palette = window.gNavToolbox.palette;

		if (!backstageReady) {
			(function(){
				let obj = {};
				for (let x in backstage.CustomizableUIInternal) {
					if (backstage.CustomizableUIInternal.hasOwnProperty(x)) {
						obj[x] = backstage.CustomizableUIInternal[x];
					}
				}
				backstage.CustomizableUIInternal = obj;
			})();
			backstage.CustomizableUIInternal.addWidgetToArea = function (widgetId, area, position, initialAdd) {
				if (area === "PanelUI-contents" &&
						this.isSpecialWidget(widgetId)) {
					let specialWidgets = backstage.gPlacements.get("PanelUI-contents").join(",")
															 .match(/GiT-menu-special-widget(spring|spacer|separator)\d+/g).join(",");
					let uniqueCount = (specialWidgets || "0")
														.replace(/[^\d,]+(\d+)/g, "$1").split(",")
                            .sort(function (a,b) {
                              return parseInt(a) > parseInt(b);
                            }).pop();
          uniqueCount = parseInt(uniqueCount) + 1;
					let specialId = "GiT-menu-special-widget" + widgetId + uniqueCount;
					let that = this;
					this.createWidget({
						id: specialId,
						type: "custom",
						onBuild: function (doc) {
							let widget = that.createSpecialWidget(widgetId, doc);
							widget.id = specialId;
							if (widget.nodeName.search(/spacer/) === -1) {
								widget.setAttribute("class", "panel-wide-item");
							}
							return widget;
						}
					});
					_CustomizableUIInternal.addWidgetToArea.call(this, specialId, area, position, initialAdd);
				} else {
					_CustomizableUIInternal.addWidgetToArea.apply(this, arguments);
				}
			};
			backstageReady = true;
		}

		let spring = document.createElement("toolbarspring");
		spring.id = "spring";
		spring.setAttribute("type", "custom");
		spring.setAttribute("flex", "1");
		spring.setAttribute("label", springName);
		spring.setAttribute("removable", "true");
		spring.classList.add("panel-wide-item");
		spring.setAttribute("cui-areatype", "toolbar");
		palette.insertBefore(spring, palette.firstChild);

		let spacer = document.createElement("toolbarspacer");
		spacer.id = "spacer";
		spacer.setAttribute("type", "custom");
		spacer.setAttribute("label", spacerName);
		spacer.setAttribute("removable", "true");
		spacer.setAttribute("cui-areatype", "toolbar");
		palette.insertBefore(spacer, spring.nextSibling);

		let separator = document.createElement("toolbarseparator");
		separator.id = "separator";
		separator.setAttribute("type", "custom");
		separator.setAttribute("label", separatorName);
		separator.setAttribute("removable", "true");
		separator.classList.add("panel-wide-item");
		separator.setAttribute("cui-areatype", "toolbar");
		palette.insertBefore(separator, spacer.nextSibling);
	}, 1000);
}

function unloadFromWindow (window) {
	if (window.document.documentElement.getAttribute("windowtype") !== "navigator:browser")
		return;

	var palette = window.gNavToolbox.palette;
	let spring = palette.querySelector("#wrapper-spring") || palette.querySelector("#spring");
	let spacer = palette.querySelector("#wrapper-spacer") || palette.querySelector("#spacer");
	let separator = palette.querySelector("#wrapper-separator") || palette.querySelector("#separator");
	palette.removeChild(spring);
	palette.removeChild(spacer);
	palette.removeChild(separator);
}

exports.load = function () {

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		loadIntoWindow(domWindow);
  }
  wm.addListener(windowListener);

	CustomizeMode.prototype.populatePalette = function () {
		_populatePalette.apply(this, arguments);
		let palette = this.window.gNavToolbox.palette;

		let springWrapper = palette.querySelector("#wrapper-spring");
		let spacerWrapper = palette.querySelector("#wrapper-spacer");
		let separatorWrapper = palette.querySelector("#wrapper-separator");

		palette.insertBefore(springWrapper, palette.firstChild);
		palette.insertBefore(spacerWrapper, springWrapper.nextSibling);
		palette.insertBefore(separatorWrapper, spacerWrapper.nextSibling);
	};

	if (backstage.gSavedState) {
		backstage.gSavedState.placements["PanelUI-contents"].forEach(function (id) {
			if (id.search(/^GiT-menu-special-widget/) !== -1) {
				CustomizableUI.createWidget({
					id: id,
					type: "custom",
					onBuild: function (doc) {
						let widget = backstage.CustomizableUIInternal.createSpecialWidget(id, doc);
						widget.id = id;
						if (widget.nodeName.search(/spacer/) === -1) {
							widget.setAttribute("class", "panel-wide-item");
						}
						return widget;
					}
				});
			}
		});
	}

	CustomizableUI.addListener(specialWidgetListener);
};

exports.unload = function () {
	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  wm.removeListener(windowListener);

  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }

	backstage.gPlacements.get("PanelUI-contents").forEach(function (id) {
		if (id.search(/^GiT-menu-special-widget/) !== -1) {
			CustomizableUI.destroyWidget(id);
		}
	});

	CustomizeMode.prototype.populatePalette = _populatePalette;
	backstage.CustomizableUIInternal = _CustomizableUIInternal;
	CustomizableUI.removeListener(specialWidgetListener);
};
