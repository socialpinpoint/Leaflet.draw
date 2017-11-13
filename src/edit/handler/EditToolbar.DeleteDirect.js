/**
 * @class L.EditToolbar.DeleteDirect
 * @aka EditToolbar.DeleteDirect
 */
L.EditToolbar.DeleteDirect = L.Handler.extend({
    statics: {
        TYPE: 'remove'
    },
    includes: L.Mixin.Events,

    addHooks: function () {
        if (this._map) {
            this._map.getContainer().focus();
        }

        var selectedLayer = this._getSelectedLayer();
        if (selectedLayer) {
            this._removeLayer(selectedLayer);
        }
    },

    initialize: function (map, options) {
        L.Handler.prototype.initialize.call(this, map);
        L.Util.setOptions(this, options);

        this._deletableLayers = this.options.featureGroup;
        if (!(this._deletableLayers instanceof L.FeatureGroup)) {
            throw new Error('options.featureGroup must be a L.FeatureGroup');
        }
        this.filterSelectedLayers = this.options.filterSelectedLayers;
        this.type = L.EditToolbar.DeleteDirect.TYPE;
    },

    disable: function () {
        if (this._enabled) {
            L.Handler.prototype.disable.call(this);
            this._map.fire(L.Draw.Event.DELETESTOP, { handler: this.type });
            this.fire('disabled', { handler: this.type });
        }
    },

    enable: function () {
        if (!this._enabled && this._hasLayers() && this._hasASingleSelectedLayer()) {
            this.fire('enabled', { handler: this.type });
            this._map.fire(L.Draw.Event.DELETESTART, { handler: this.type });
            L.Handler.prototype.enable.call(this);
        }
    },

    removeHooks: function () {
    },

    revertLayers: function () {
    },

    _getSelectedLayer: function () {
        var availableLayers = this._deletableLayers.getLayers();
        var selectedLayers = availableLayers && this.options.filterSelectedLayers && this.filterSelectedLayers(availableLayers);
        return selectedLayers && selectedLayers.length > 0
            ? selectedLayers[0]
            : null;
    },

    _hasLayers: function () {
        var availableLayers = this._deletableLayers.getLayers();
        return availableLayers && availableLayers.length > 0;
    },

    _hasASingleSelectedLayer: function () {
        var availableLayers = this.options.featureGroup.getLayers();
        var selectedLayers = availableLayers && this.options.filterSelectedLayers && this.options.filterSelectedLayers(availableLayers);
        return selectedLayers && selectedLayers.length === 1;
    },

    _removeLayer: function (eventOrLayer) {
        var layer = eventOrLayer.layer || eventOrLayer.target || eventOrLayer;
        if (layer) {
            this._deletableLayers.removeLayer(layer);


            var deletedLayers = new L.LayerGroup();
            deletedLayers.addLayer(layer);
            this._map.fire(L.Draw.Event.DELETED, { layers: deletedLayers });

            layer.fire('deleted');
            this.disable();
        }
    }
});
