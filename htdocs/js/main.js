// The main.js enclosure
(function(){
	// Setup variables
	//var touch = Modernizr.touch;
	//var gps = navigator.geolocation;
	var defaultLat = 41.85;
	var defaultLng = -87.675;
	var locnames = [];
	var School = {};
	School.LatLngs = [];
	School.Markers = [];
	School.InfoBox = [];
	School.InfoBoxText = [];
	/**
	* Factory method to open info boxes
	* @param theMap
	* @param theMarker
	* @param theInfoWindow
	* @returns {Function}
	*/
	School.openInfoBox = function(theMap,theMarker,theInfoBox) {
		return function() { theInfoBox.open(theMap,theMarker); };
	};
	School.closeInfoBox = function(theMap,theMarker,theInfoBox) {
		return function() { theInfoBox.close(theMap,theMarker); };
	};
	
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
		// Pan/Zoom
		Map.setPanZoom(false);
		Map.setTouchScroll(true);
		// Set Pan/Zoom Control
		var PanZoomControlDiv = document.createElement('div');
		var panZoomControl = new PanZoomControl(PanZoomControlDiv, Map.Map);
		PanZoomControlDiv.index = 1;
		Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(PanZoomControlDiv);
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
					// Push to the location names array the name of the school
					locnames.push(ftdata.rows[i][2]);
					// Create the Google LatLng object
					School.LatLngs[i] = new google.maps.LatLng(ftdata.rows[i][0],ftdata.rows[i][1]);
					// Create the Markers for each school
					School.Markers[i] = new google.maps.Marker({
						position: School.LatLngs[i],
						map: Map.Map,
						icon:'/img/blue.png',
						shadow:'img/msmarker.shadow.png'
					});
					// Info boxes
					School.InfoBoxText[i] = '<div class="infoBox" style="border:1px solid rgb(0,0,0); margin-top:8px; background:rgb(255,189,136); padding:5px; font-size:80%;">'+
					ftdata.rows[i][2]+'<br />'+
					ftdata.rows[i][3]+'<br />'+
					ftdata.rows[i][5]+'<br /></div>';
					var options = {
						content: School.InfoBoxText[i]
						,disableAutoPan: false
						,maxWidth: 0
						,pixelOffset: new google.maps.Size(-140, 0)
						,zIndex: null
						,boxStyle: {
							background: "url('img/tipbox.gif') no-repeat"
							,opacity: 0.95
							,width: "160px"
						}
						,closeBoxMargin: "10px 2px 2px 2px"
						,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
						,infoBoxClearance: new google.maps.Size(1, 1)
						,isHidden: false
						,pane: "floatPane"
						,enableEventPropagation: false
					};
					// Make the info boxes
					School.InfoBox[i] = new InfoBox(options);
					// Make the listeners for the info boxes
					google.maps.event.addListener(School.Markers[i], 'mouseover', School.openInfoBox(Map.Map,School.Markers[i],School.InfoBox[i]));
					google.maps.event.addListener(School.Markers[i], 'click', School.openInfoBox(Map.Map,School.Markers[i],School.InfoBox[i]));
					google.maps.event.addListener(School.Markers[i], 'mouseout', School.closeInfoBox(Map.Map,School.Markers[i],School.InfoBox[i]));
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
		// Put a Pan/Zoom control on the map
		function PanZoomControl(controlDiv, map) {
			// Set CSS styles for the DIV containing the control
			// Setting padding to 5 px will offset the control
			// from the edge of the map.
			controlDiv.style.padding = '1em';
			// Set CSS for the control border.
			var controlUI = document.createElement('div');
			controlUI.style.backgroundColor = 'white';
			controlUI.style.borderStyle = 'solid';
			controlUI.style.borderWidth = '2px';
			controlUI.style.cursor = 'pointer';
			controlUI.style.textAlign = 'center';
			controlUI.title = 'Click to set the map to Home';
			controlDiv.appendChild(controlUI);
			// Set CSS for the control interior.
			var controlText = document.createElement('div');
			controlText.style.fontFamily = 'sans-serif';
			controlText.style.fontSize = '12px';
			controlText.style.paddingLeft = '.5em';
			controlText.style.paddingRight = '.5em';
			controlText.style.paddingTop = '.3em';
			controlText.style.paddingBottom = '.3em';
			controlText.innerHTML = 'Maximize';
			controlUI.appendChild(controlText);
			// Setup the click event listeners.
			google.maps.event.addDomListener(controlUI, 'click', function() {
				if(Map.Map.zoomControl == false)
				{
					Map.setPanZoom(true);
					Map.setTouchScroll(false);
					var cntr = Map.Map.getCenter();
					$('#before-map,#div-footer').hide(750,function(){
						$('#map-width').css('height','100%');
						$('#map-ratio').css('margin-top', window.innerHeight);
						$('#div-map').offset().top;
						controlText.innerHTML = 'Minimize';
						Map.Map.setCenter(cntr);
						google.maps.event.trigger(Map.Map, 'resize');
					});
				}
				else
				{
					Map.setPanZoom(false);
					Map.setTouchScroll(true);
					var cntr = Map.Map.getCenter();
					$('#before-map,#div-footer').show(750,function(){
						$('#map-width').css('height','');
						$('#map-ratio').css('margin-top','200px');
						controlText.innerHTML = 'Maximize';
						Map.Map.setCenter(cntr);
						google.maps.event.trigger(Map.Map, 'resize');
					});
				}
			});
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