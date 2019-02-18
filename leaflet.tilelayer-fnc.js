/*
 * leaflet.tilelayer-fnc.js
 */

L.TileLayer.include({
	getTileUrl: function (coords) {
		var tileBounds = this._tileCoordsToBounds(coords);
		var crs = this._map.options.crs;
		var nw = crs.project(tileBounds.getNorthWest());
		var se = crs.project(tileBounds.getSouthEast());
		var tileSize = this.options.tileSize;

		var data = {
			r: L.Browser.retina ? '@2x' : '',
			s: this._getSubdomain(coords),
			x: coords.x,
			y: coords.y,
			z: this._getZoomForUrl()
		};
		if (!crs.infinite) {
			var invertedY = this._globalTileRange.max.y - coords.y;
			if (this.options.tms) {
				data['y'] = invertedY;
			}
			data['-y'] = invertedY;
		}

		// WMS, ArcGIS ExportImage
		if (this.options.detectRetina && L.Browser.retina) {
			tileSize = tileSize.multiplyBy(2);
		}
		L.extend(data, {
			crs: crs.code,
			bbox: [nw.x, se.y, se.x, nw.y].join(','), // xmin,ymin,xmax,ymax
			width: tileSize.x,
			height: tileSize.y
		});

		if (typeof this._url === 'function') {
			return this._url(data, this);
		}
		return L.Util.template(this._url, L.extend(data, this.options));
	},
});

/* static getUrl function factories */

L.TileLayer.getUrlWms = function (base, options) {
	var wmsParams;

	return function (data, tileLayer) {
		options = options || tileLayer.options;

		wmsParams = wmsParams || { // whitelist
//			service: 'WMS', // not in spec
			version: options.version || '1.1.1',
			request: 'GetMap',
			layers: options.layers,
			styles: options.styles || '',
			crs: data.crs, // WMS 1.3
			srs: data.crs, // WMS < 1.3
			bbox: undefined, // placeholder
			width: undefined, // placeholder
			height: undefined, // placeholder
			format: options.format || 'image/jpeg',
			transparent: Boolean(options.transparent)
		};

		wmsParams.bbox = data.bbox;
		wmsParams.width = data.width;
		wmsParams.height = data.height;

		return base + L.Util.getParamString(wmsParams, base, options.uppercase);
	};
};

L.TileLayer.getUrlWmts = function (base, options) {
	var tileMatrixPrefix = options.tileMatrixPrefix || '';
	var wmtsParams;

	return function (data, tileLayer) {
		options = options || tileLayer.options;

		wmtsParams = wmtsParams || { // whitelist
			service: 'WMTS',
			request: 'GetTile',
			version: options.version || '1.0.0',
			layer: options.layer,
			style: options.style || 'default',
			format: options.format || 'image/png',
			tileMatrixSet: options.tileMatrixSet,
			tileMatrix: undefined, // placeholder
			tileRow: undefined, // placeholder
			tileCol: undefined // placeholder
		};

		wmtsParams.tileMatrix = tileMatrixPrefix + data.z;
		wmtsParams.tileRow = data.y;
		wmtsParams.tileCol = data.x;

		return base + L.Util.getParamString(wmtsParams, base, options.uppercase);
	};
};

/* utility/helper method */

L.getUrl = function (base, params, uppercase) {
	return base + L.Util.getParamString(params, base, uppercase);
};
