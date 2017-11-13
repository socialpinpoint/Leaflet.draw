/*L.Map.mergeOptions({
 editControl: true
 });*/
/**
 * @class L.EditToolbar
 * @aka EditToolbar
 */
L.EditToolbar = L.Toolbar.extend({
	statics: {
		TYPE: 'edit'
	},

	options: {
		edit: {
			selectedPathOptions: {
				dashArray: '10, 10',

				fill: true,
				fillColor: '#fe57a1',
				fillOpacity: 0.1,

				// Whether to user the existing layers color
				maintainColor: false
			}
		},
		remove: {
			direct: false,
			filterSelectedLayers: function (layers) { return []; }
		},
		poly: null,
		featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
	},

	// @method intialize(): void
	initialize: function (options) {
		// Need to set this manually since null is an acceptable value here
		if (options.edit) {
			if (typeof options.edit.selectedPathOptions === 'undefined') {
				options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
			}
			options.edit.selectedPathOptions = L.extend({}, this.options.edit.selectedPathOptions, options.edit.selectedPathOptions);
		}

		if (options.remove) {
			options.remove = L.extend({}, this.options.remove, options.remove);
		}

		if (options.poly) {
			options.poly = L.extend({}, this.options.poly, options.poly);
		}

		this._toolbarClass = 'leaflet-draw-edit';
		L.Toolbar.prototype.initialize.call(this, options);

		this._selectedFeatureCount = 0;
	},

	// @method getModeHandlers(): object
	// Get mode handlers information
	getModeHandlers: function (map) {
		var featureGroup = this.options.featureGroup;
		var removeHandler = this.options.remove.direct
			? {
				enabled: this.options.remove,
				handler: new L.EditToolbar.DeleteDirect(map, {
					featureGroup: featureGroup,
					filterSelectedLayers: this.options.remove.filterSelectedLayers
				}),
				title: L.drawLocal.edit.toolbar.buttons.removeDirect
			}
			: {
				enabled: this.options.remove,
				handler: new L.EditToolbar.Delete(map, {
					featureGroup: featureGroup
				}),
				title: L.drawLocal.edit.toolbar.buttons.remove
			};

		return [
			{
				enabled: this.options.edit,
				handler: new L.EditToolbar.Edit(map, {
					featureGroup: featureGroup,
					selectedPathOptions: this.options.edit.selectedPathOptions,
					poly: this.options.poly
				}),
				title: L.drawLocal.edit.toolbar.buttons.edit
			},
 			removeHandler
		];
	},

	// @method getActions(): object
	// Get actions information
    getActions: function(handler) {

			return this.options.remove &&
             !this.options.remove.direct &&
             (handler.type === L.EditToolbar.Delete.TYPE)
			? [
				{
					title: L.drawLocal.edit.toolbar.actions.save.title,
					text: L.drawLocal.edit.toolbar.actions.save.text,
					callback: this._save,
					context: this
				},
				{
					title: L.drawLocal.edit.toolbar.actions.cancel.title,
					text: L.drawLocal.edit.toolbar.actions.cancel.text,
					callback: this.disable,
					context: this
				},
				{
					title: L.drawLocal.edit.toolbar.actions.clearAll.title,
					text: L.drawLocal.edit.toolbar.actions.clearAll.text,
					callback: this._clearAllLayers,
					context: this
				}
			]
			: [];
	},

	// @method addToolbar(map): L.DomUtil
	// Adds the toolbar to the map
	addToolbar: function (map) {
		var container = L.Toolbar.prototype.addToolbar.call(this, map);

		this._checkDisabled();


		this.options.featureGroup.eachLayer(this._onLayerAdd, this);
		this.options.featureGroup
        .on('layeradd', this._onLayerAdd, this)
        .on('layerremove', this._onLayerRemove, this);

		return container;
	},

	// @method removeToolbar(): void
	// Removes the toolbar from the map
	removeToolbar: function() {

		this.options.featureGroup
        .off('layeradd', this._onLayerAdd, this)
        .off('layerremove', this._onLayerRemove, this);
		this.options.featureGroup.eachLayer(this._onLayerRemove, this);

		L.Toolbar.prototype.removeToolbar.call(this);
	},

	// @method disable(): void
	// Disables the toolbar
	disable: function () {
		if (!this.enabled()) {
			return;
		}

		this._activeMode.handler.revertLayers();

		L.Toolbar.prototype.disable.call(this);
	},

	_save: function () {
		this._activeMode.handler.save();
		if (this._activeMode) {
			this._activeMode.handler.disable();
		}
	},

	_clearAllLayers:function(){
		this._activeMode.handler.removeAllLayers();
		if (this._activeMode) {
			this._activeMode.handler.disable();
		}
	},

	_checkDisabled: function () {
		var hasLayers = this._hasLayers();
		var hasSingleLayer = this._hasASingleSelectedLayer();
		var button = null;

		if (this.options.edit) {
			button = this._modes[L.EditToolbar.Edit.TYPE].button;
			button.setAttribute(
			  'title',
			  hasLayers
			    ? L.drawLocal.edit.toolbar.buttons.edit
			    : L.drawLocal.edit.toolbar.buttons.editDisabled);

			if (hasLayers) {
				L.DomUtil.removeClass(button, 'leaflet-disabled');
			} else {
				L.DomUtil.addClass(button, 'leaflet-disabled');
			}
    }

    if (this.options.remove) {
    
      if (this.options.remove.direct) {
        button = this._modes[L.EditToolbar.DeleteDirect.TYPE].button;
        button.setAttribute(
          'title',
          hasLayers && hasSingleLayer
            ? L.drawLocal.edit.toolbar.buttons.removeDirect
            : L.drawLocal.edit.toolbar.buttons.removeDirectDisabled);
            
        if (hasLayers && hasSingleLayer) {
          L.DomUtil.removeClass(button, 'leaflet-disabled');
        } else {
          L.DomUtil.addClass(button, 'leaflet-disabled');
        }
      }
      else {
        button = this._modes[L.EditToolbar.Delete.TYPE].button;
        button.setAttribute(
          'title',
          hasLayers
            ? L.drawLocal.edit.toolbar.buttons.remove
            : L.drawLocal.edit.toolbar.buttons.removeDisabled);
            
        if (hasLayers) {
          L.DomUtil.removeClass(button, 'leaflet-disabled');
        } else {
          L.DomUtil.addClass(button, 'leaflet-disabled');
        }
      }
    }
  },

  _hasASingleSelectedLayer: function () {
    var availableLayers = this.options.featureGroup.getLayers();
    var selectedLayers = availableLayers && this.options.remove.filterSelectedLayers && this.options.remove.filterSelectedLayers(availableLayers);
    return selectedLayers && selectedLayers.length === 1;
  },

  _hasLayers: function () {
    var availableLayers = this.options.featureGroup.getLayers();
    return availableLayers && availableLayers.length > 0;
  },

  _onLayerAdd: function (event) {
    var layer = event.layer || event.target || event;
    layer.on('click', this._checkDisabled, this);
    this._checkDisabled();
  },

  _onLayerRemove: function (event) {
    var layer = event.layer || event.target || event;
    layer.off('click', this._checkDisabled, this);
    this._checkDisabled();
  }
});
