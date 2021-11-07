/*
 * leaflet.tilelayer-fix.js
 *
 * temporary(?) patch
 */

L.GridLayer.include({
	initialize: function (options) {
		options = L.setOptions(this, options);

		// normalize options
		var tileSize = options.tileSize;
		options.tileSize = (typeof tileSize === 'number') ? new L.Point(tileSize, tileSize) : L.point(tileSize); // Point

		var bounds = options.bounds;
		options.bounds = bounds ? L.latLngBounds(bounds) : bounds; // LatLngBounds|null
	},

	getTileSize: function () {
		return this.options.tileSize;
	},

	_isValidTile: function (coords) {
		var crs = this._map.options.crs;

		if (!crs.infinite) {
			// don't load tile if it's out of bounds and not wrapped
			var bounds = this._globalTileRange;
			if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
			    (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
		}

		if (!this.options.bounds) { return true; }

		// don't load tile if it doesn't intersect the bounds in options
		var tileBounds = this._tileCoordsToBounds(coords);
		return this.options.bounds.overlaps(tileBounds);
	}
});

L.TileLayer.include({
	initialize: function (url, options) {
		this._url = url;

		L.GridLayer.prototype.initialize.call(this, options);
		options = this.options;

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {
			options.tileSize._divideBy(2)._floor();

			if (!options.zoomReverse) {
				options.zoomOffset++;
				options.maxZoom--;
			} else {
				options.zoomOffset--;
				options.minZoom++;
			}

			options.minZoom = Math.max(0, options.minZoom);
		}

		if (typeof options.subdomains === 'string') {
			options.subdomains = options.subdomains.split('');
		}

		this.on('tileunload', this._onTileRemove);
	}
});

L.TileLayer.WMS.include({
	initialize: function (url, options) {
		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams);

		// all keys that are not TileLayer options go to WMS params
		for (var i in options) {
			if (!(i in this.options)) {
				wmsParams[i] = options[i];
			}
		}

		L.GridLayer.prototype.initialize.call(this, options);

		var realRetina = options.detectRetina && L.Browser.retina ? 2 : 1;
		var tileSize = this.getTileSize();
		wmsParams.width = tileSize.x * realRetina;
		wmsParams.height = tileSize.y * realRetina;

		this.wmsParams = wmsParams;
	}
});
