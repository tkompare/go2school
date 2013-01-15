// The main.js enclosure
(function(){
	// Setup variables
	//var touch = Modernizr.touch;
	//var gps = navigator.geolocation;
	var defaultLat = 41.85;
	var defaultLng = -87.675;
	var locnames = [];
	
	// The jQuery document.ready enclosure
	$(function(){
		
		// Set up the loading message
		$('#loadingmsg')
			.hide()  // hide it initially
			.ajaxStart(function() {
				$(this).show();
			})
			.ajaxStop(function() {
				$(this).hide();
			})
		;
		
		// The Google map base layer object
		var Map = new TkMap({
			domid:'map',
			lat:defaultLat,
			lng:defaultLng,
			styles:'grey',
			zoom:14
		});
		Map.initMap();
		
		// The FT query
		var ftquery = encodeURIComponent("SELECT lat, lng, shortname, address, postalcode, phone, start, end, afterstart, afterend FROM 1QQu0GHzbkKk5OdAl2VaaY2sm1Ggoc8Vo5GfiGLI");
		
		// Construct the URL
		var fturl = ['https://www.googleapis.com/fusiontables/v1/query'];
		fturl.push('?sql=' + ftquery);
		fturl.push('&key=AIzaSyDH5WuL3gKYVBWVqLr6g3PQffdZE-XhBUw');
		fturl.push('&callback=?');
		
		// Get the FT data!
		$.ajax({
			url: fturl.join(''),
			dataType: 'jsonp',
			success: function (ftdata) {
				for (var i in ftdata.rows)
				{
					locnames.push(ftdata.rows[i][2]);
				}
				// Set up the typeahead for the school names.
				$('#school').typeahead({
					source:locnames,
					items:3,
					minLength:1
				});
			}
		});
		
		// FUNCTIONS -------------------------------------------------------------/
		
		// Center the map on the school in the school name input
		function centeronschool() {
			console.log('centeronschool');
		}
		
		// Center the map on the user's location in the location input
		function centeronuser() {
			console.log('centeronuser');
		}
		
		// LISTENERS -------------------------------------------------------------/
		
		// school input onblur
		$('#school').blur(function(){
			centeronschool();
		});
		
		// find school button click
		$('#btn-find-school').click(function(){
			centeronschool();
		});
		
	// school input onblur
		$('#location').blur(function(){
			centeronschool();
		});
		
		// find school button click
		$('#btn-search-location').click(function(){
			centeronschool();
		});
	});
	
})();