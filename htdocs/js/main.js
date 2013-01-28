// The main.js enclosure
(function(){
	// Setup variables
	//var touch = Modernizr.touch;
	var gps = navigator.geolocation;
	var Default = {
		lat:41.85,
		lng:-87.675,
		city:'Chicago',
		state:'IL',
		styles:'grey minlabels',
		zoom:14
	};
	var locnames = [];
	var MyLocation = {
		lat:null,
		lng:null,
		LatLng:null,
		address:null
	};
	var School = {
		data:[],
		LatLngs:[],
		Markers:[],
		InfoBox:[],
		InfoBoxText:[],
		/**
		* Factory method to open & close info boxes
		* @param theMap
		* @param theMarker
		* @param theInfoWindow
		* @returns {Function}
		*/
		toggleInfoBox:function(theMap,theMarker,theInfoBox) {
			return function(){
				if(theInfoBox.visible)
				{
					theInfoBox.close(theMap,theMarker);
				}
				else
				{
					theInfoBox.open(theMap,theMarker);
				}
			};
		}
	};
	
	//hide some stuff by default
	$('#travel,#grp-mylocation').hide();
	
	// The jQuery document.ready enclosure
	$(function(){
		
		// See if local storage has any values to fill in the form with
		if($.jStorage.storageAvailable())
		{
			$('#school').val($.jStorage.get('school',''));
			$('#mylocation').val($.jStorage.get('mylocation',''));
		}
		
		// Set up the loading message
		$('#loading').hide();
		$(document).ajaxStart(function() {
			$('#loading').show();
		})
		.ajaxStop(function() {
			$('#loading').hide();
		});
		
		// The Google map base layer object
		var Map = new TkMap({
			domid:'map',
			lat:Default.lat,
			lng:Default.lng,
			styles:Default.styles,
			zoom:Default.zoom
		});
		Map.initMap();
		
		// Pan/Zoom
		Map.setPanZoom(false);
		Map.setTouchScroll(true);
		var PanZoomControlDiv = document.createElement('div');
		var panZoomControl = new PanZoomControl(PanZoomControlDiv);
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
				// Copy the data to the School object
				for (var i in ftdata.rows)
				{
					School.data[i] = [];
					for(var j in ftdata.columns)
					{
						var colname = ftdata.columns[j];
						School.data[i][colname] = ftdata.rows[i][j];
					}
					// Push to the location names array the name of the school
					locnames.push(ftdata.rows[i][2]);
					// Create the Google LatLng object
					School.LatLngs[i] = new google.maps.LatLng(ftdata.rows[i][0],ftdata.rows[i][1]);
					// Create the Markers for each school
					School.Markers[i] = new google.maps.Marker({
						position: School.LatLngs[i],
						map: Map.Map,
						icon:'img/orange.png',
						shadow:'img/msmarker.shadow.png'
					});
					// Info boxes
					School.InfoBoxText[i] = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(25,25,112); padding:5px; color:white; font-size:80%;">'+
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
							,opacity: 0.9
							,width: "160px"
						}
						,closeBoxMargin: "11px 4px 4px 4px"
						,closeBoxURL: "img/close.gif"
						,infoBoxClearance: new google.maps.Size(1, 1)
						,visible: false
						,pane: "floatPane"
						,enableEventPropagation: false
					};
					// Make the info boxes
					School.InfoBox[i] = new InfoBox(options);
					School.InfoBox[i].onmap = 0;
				}
				// Try to center on school in school input 
				centeronschool();
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
			if($('#school').val() != '')
			{
				for(var i in School.data)
				{
					if(School.data[i].shortname == $('#school').val())
					{
						Map.Map.setCenter(School.LatLngs[i]);
						School.InfoBox[i].open(Map.Map,School.Markers[i]);
					}
					else
					{
						School.InfoBox[i].close(Map.Map,School.Markers[i]);
					}
				}
			}
		}
		
		// Center the map on the user's location in the location input
		function mylocationcenter() {
			console.log('centeronmylocation');
		}
		
		/**
		 * No GPS?
		 */
		function handleNoGeolocation(errorFlag)
		{
			if (errorFlag)
			{
				alert('We\'re sorry. Your browser\'s geolocation service failed.');
			}
			else
			{
				alert('We\'re sorry! Your browser does not support geolocation.');
			}
		}
		
		// Get address from GPS
		function mylocationgps() {
			function alertError() {
				alert('We\'re sorry. We could not find an address for this location.');
			}
			if(gps)
			{
				// grab the lat/lng
				navigator.geolocation.getCurrentPosition(
					function(position)
					{
						MyLocation.lat = position.coords.latitude;
						MyLocation.lng = position.coords.longitude;
						MyLocation.LatLng = new google.maps.LatLng(
							position.coords.latitude,
							position.coords.longitude
						);
						// Find the address
						var geocoder = new google.maps.Geocoder();
						geocoder.geocode(
							{'latLng':MyLocation.LatLng},
							function(results,status)
							{
								if (status == google.maps.GeocoderStatus.OK)
								{
									if (results[1])
									{
										var formattedAddress = results[0].formatted_address.split(',');
										MyLocation.address = formattedAddress[0];
										$('#mylocation').val(formattedAddress[0]);
										if($.jStorage.storageAvailable())
										{
											$.jStorage.set('mylocation', formattedAddress[0]);
										}
									}
									else
									{
										alertError();
									}
								}
								else
								{
									alertError();
								}
							}
						);
					},
					function()
					{
						// Can't find the address
						handleNoGeolocation(true);
					}
				);
			}
			else
			{
				// Browser doesn't support Geolocation
				handleNoGeolocation(false);
			}
		}
		
		// Put a Pan/Zoom control on the map
		function PanZoomControl(controlDiv) {
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
			controlText.innerHTML = 'Explore Map';
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
					for(var i in School.Markers)
					{
						google.maps.event.addListener(School.Markers[i], 'click', School.toggleInfoBox(Map.Map,School.Markers[i],School.InfoBox[i]));
					}
				}
				else
				{
					Map.setPanZoom(false);
					Map.setTouchScroll(true);
					var cntr = Map.Map.getCenter();
					$('#before-map,#div-footer').show(750,function(){
						$('#map-width').css('height','');
						$('#map-ratio').css('margin-top','200px');
						controlText.innerHTML = 'Explore Map';
						Map.Map.setCenter(cntr);
						google.maps.event.trigger(Map.Map, 'resize');
					});
					for(var i in School.Markers)
					{
						google.maps.event.clearListeners(School.Markers[i], 'click');
					}
				}
			});
		}
		// LISTENERS -------------------------------------------------------------/
		
		// school input change
		$('#school').change(function(){
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('school', $('#school').val());
			}
			centeronschool();
		});
		
		// school "next" button click
		$('#school-next').click(function(){
			$('#grp-school').hide();
			$('#grp-mylocation').show();
		});
		
		// school input onblur
		$('#school').blur(function(){
			centeronschool();
		});
		
		// find me button click
		$('#mylocation-gps').click(function(){
			mylocationgps();
		});
		
		// mylocation input change
		$('#mylocation').change(function(){
			/**
			 * show an addressing error
			 */
			function addressError()
			{
				alert('We\'re sorry. We could not locate this address. Please doublecheck you\'ve entered your address correctly.');
			}
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('mylocation', $('#mylocation').val());
			}
			if($('#mylocation').val() != MyLocation.address)
			{
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode(
					{address:$('#mylocation').val()+', ' + Default.city + ', ' + Default.state},
					function(results, status)
					{
						if (status == google.maps.GeocoderStatus.OK)
						{
							if (results[0])
							{
								MyLocation.LatLng = results[0].geometry.location;
								MyLocation.lat = MyLocation.LatLng.lat();
								MyLocation.lng = MyLocation.LatLng.lng();
								MyLocation.address = $('#mylocation').val();
								console.log(MyLocation);
							}
							else
							{
								addressError();
							}
						}
						else
						{
							addressError();
						}
					}
				);
			}
		});
	});
	
})();