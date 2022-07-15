const map = L.map('mapContainer', {
	center: [50, 5], 
	layers: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '<a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
	}),
	minZoom: 2
});
const overlay = L.tileLayer(function (data) {
	const base = 'https://geo4.service24.rlp.de/wms/dop_basis.fcgi';
	const wmsParams = {
		version: '1.3.0',
		request: 'GetMap',
		layers: Math.random() < 0.5 ? 'rp_dop_metadaten' : 'rp_dop', // !
		styles: '',
		crs: data.crs, // WMS 1.3
		bbox: data.bbox,
		width: data.width,
		height: data.height,
		format: 'image/png',
		transparent: true
	};

	return base + L.Util.getParamString(wmsParams, base);
}, {
	minZoom: 8,
	bounds: [[48.898, 6.03777], [51.0009, 8.6177]],
	tileSize: L.point(256, 128), // !
	attribution: '<a href="https://lvermgeo.rlp.de">GeoBasis-DE / LVermGeoRP, dl-de/by-2-0</a>'
}).addTo(map);

map.fitBounds(L.latLngBounds(overlay.options.bounds));
