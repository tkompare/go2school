// The main.js enclosure
(function(){
	var touch = Modernizr.touch;
	var gps = navigator.geolocation;
	var defaultLat = 41.85;
	var defaultLng = -87.675;
	// The jQuery document.ready enclosure
	$(function(){
		var Map = new TkMap({
			domid:'map',
			lat:defaultLat,
			lng:defaultLng,
			styles:'grey',
			zoom:11
		});
		Map.initMap();
	});
})();