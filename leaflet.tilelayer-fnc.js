/*
 * leaflet.tilelayer-fnc.js
 */

{
	const initialize = L.TileLayer.prototype.initialize;

	L.TileLayer.prototype.initialize = function (url, options = {}) {
		this._urlData = {
			r: L.Browser.retina ? '@2x' : '',
			// placeholders
			s: undefined,
			x: undefined,
			y: undefined,
			z: undefined,

			crs: undefined,
			bbox: undefined,
			width: undefined,
			height: undefined
		};

		// append unknown options to _urlData
		for (const key in options) {
			if (!(key in this.options)) {
				this._urlData[key] = options[key];
			}
		}

		initialize.call(this, url, options);
	};

	const onAdd = L.TileLayer.prototype.onAdd;

	L.TileLayer.prototype.onAdd = function (map) {
		this._urlData.crs = map.options.crs.code;

		onAdd.call(this, map);
	};
}

L.TileLayer.prototype.getTileUrl = function (coords) {
	const crs = this._map.options.crs;

	const data = this._urlData;
	data.s = this._getSubdomain(coords);
	data.x = coords.x;
	data.y = coords.y;
	data.z = this._getZoomForUrl();

	if (!crs.infinite) {
		const invertedY = this._globalTileRange.max.y - coords.y;
		if (this.options.tms) {
			data['y'] = invertedY;
		}
		data['-y'] = invertedY;
	}

	// WMS, ArcGIS ExportImage
	const [nw, se] = this._tileCoordsToNwSe(coords).map(latLng => crs.project(latLng));
	data.bbox = `${nw.x},${se.y},${se.x},${nw.y}`; // xmin,ymin,xmax,ymax

	const tileSize = this.getTileSize();
	const retinaFactor = (this.options.detectRetina && L.Browser.retina) ? 2 : 1;
	data.width  = tileSize.x * retinaFactor;
	data.height = tileSize.y * retinaFactor;

	if (typeof this._url === 'function') {
		return this._url(data, this);
	}
	return L.Util.template(this._url, data);
};

/* static getUrl function factories */

L.TileLayer.getUrlWms = function (base, options) {
	let wmsParams;

	return function (data, tileLayer) {
		options = options ?? tileLayer.options;

		wmsParams = wmsParams ?? { // whitelist
//			service: 'WMS', // not in spec
			version: options.version || '1.1.1',
			request: 'GetMap',
			layers: options.layers,
			styles: options.styles ?? '',
			crs: data.crs, // WMS 1.3
			srs: data.crs, // WMS < 1.3
			bbox: undefined, // placeholder
			width: undefined, // placeholder
			height: undefined, // placeholder
			format: options.format ?? 'image/jpeg',
			transparent: Boolean(options.transparent)
		};

		wmsParams.bbox = data.bbox;
		wmsParams.width = data.width;
		wmsParams.height = data.height;

		return base + L.Util.getParamString(wmsParams, base, options.uppercase);
	};
};

L.TileLayer.getUrlWmts = function (base, options) {
	const tileMatrixPrefix = options.tileMatrixPrefix ?? '';

	let wmtsParams;

	return function (data, tileLayer) {
		options = options ?? tileLayer.options;

		wmtsParams = wmtsParams ?? { // whitelist
			service: 'WMTS',
			request: 'GetTile',
			version: options.version || '1.0.0',
			layer: options.layer,
			style: options.style ?? 'default',
			format: options.format ?? 'image/png',
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
