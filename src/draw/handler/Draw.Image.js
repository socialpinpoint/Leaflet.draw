/**
 * Extends the UX of rectangle drawing to define the initial anchor points and clipping rectangle of
 * a new instance of L.ImageTransform.
 *
 * Utilises the services of an imageProvider (via options) whose responsibility is to provide the
 * path to an image to be contained within the resulting shape.
 *
 * @class L.Draw.Image
 * @aka Draw.Image
 * @inherits L.Draw.Rectangle
 */
L.Draw.Image = L.Draw.Rectangle.extend({
    statics: {
        TYPE: 'image'
    },

    options: L.extend({},
        L.Draw.Rectangle.prototype.options,
        {
            imageProvider: {
                getImagePath: function() { return null; }
            }
        }
    ),

    initialize: function(map, options) {
        this.type = L.Draw.Image.TYPE;
        this._initialLabelText = L.drawLocal.draw.handlers.image.tooltip.start;
        L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
    },

    _fireCreatedEvent: function() {
        var self = this;
        var shapeBounds = this._shape.getLatLngs()[0];
        var shapeOptions = this.options.shapeOptions;
        this.options.imageProvider.getImagePath()
            .then(function(imagePath) {
                if (imagePath) {

                    var rectangle = new L.Rectangle(_.cloneDeep(shapeBounds), shapeOptions);
                    rectangle.image = {
                        url: imagePath
                    };
                    L.Draw.SimpleShape.prototype._fireCreatedEvent.call(self, rectangle);
                }
            });
    }
});