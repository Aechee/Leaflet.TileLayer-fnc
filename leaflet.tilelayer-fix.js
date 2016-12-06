/*
 * leaflet.tilelayer-fix.js
 *
 * temporary(?) patch
 */

L.GridLayer.include({
	initialize: function (options) {
		var option;

		options = L.setOptions(this, options);

		// normalize options
		option = options.tileSize;
		options.tileSize = (typeof option === 'number') ? new L.Point(option, option) : L.point(option); // Point

		option = options.bounds;
		options.bounds = option ? L.latLngBounds(option) : option; // LatLngBounds|null
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
		}

		if (typeof options.subdomains === 'string') {
			options.subdomains = options.subdomains.split('');
		}

		// for https://github.com/Leaflet/Leaflet/issues/137
		if (!L.Browser.android) {
			this.on('tileunload', this._onTileRemove);
		}
	},

	getTileSize: function () {
		var map = this._map,
		    tileSize = this.options.tileSize,
		    zoom = this._tileZoom + this.options.zoomOffset,
		    minNativeZoom = this.options.minNativeZoom,
		    maxNativeZoom = this.options.maxNativeZoom;

		// decrease tile size when scaling below minNativeZoom
		if (minNativeZoom !== null && zoom < minNativeZoom) {
			return tileSize.divideBy(map.getZoomScale(minNativeZoom, zoom))._round();
		}

		// increase tile size when scaling above maxNativeZoom
		if (maxNativeZoom !== null && zoom > maxNativeZoom) {
			return tileSize.divideBy(map.getZoomScale(maxNativeZoom, zoom))._round();
		}

		return tileSize;
	}
});

L.TileLayer.WMS.include({
	initialize: function (url, options) {
		var tileSize;

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams);

		// all keys that are not TileLayer options go to WMS params
		for (var i in options) {
			if (!(i in this.options)) {
				wmsParams[i] = options[i];
			}
		}

		L.GridLayer.prototype.initialize.call(this, options);

		tileSize = this.options.tileSize;
		if (options.detectRetina && L.Browser.retina) {
			tileSize = tileSize.multiplyBy(2);
		}
		wmsParams.width  = tileSize.x;
		wmsParams.height = tileSize.y;

		this.wmsParams = wmsParams;
	}
});
