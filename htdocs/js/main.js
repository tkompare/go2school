// The main.js enclosure
(function(){
	// Setup variables
	
	/**
	 * Default settings for this application
	 * @type object
	 */
	var Application = {
		city:'Chicago',
		lat:41.85,
		lng:-87.675,
		state:'IL',
		styles:'grey minlabels',
		zoom:14,
		schooltoday:'No Schedule Available',
		googlemapsapikey:'AIzaSyDH5WuL3gKYVBWVqLr6g3PQffdZE-XhBUw',
		schoolschedulequery:'SELECT date, dayofweek, unifiedcalendar FROM 1u765vIMSPecSEinBe1H6JPYSFE5ljbAW1Mq3okc',
		schoollocationquery:'SELECT lat, lng, shortname, address, postalcode, phone, start, end, afterstart, afterend FROM 1QQu0GHzbkKk5OdAl2VaaY2sm1Ggoc8Vo5GfiGLI'
	};
	
	/**
	 * Is the user's device gps capable?
	 * @type boolean
	 */
	var gps = navigator.geolocation;
	
	/**
	 * Hold the user's location information
	 * @type object
	 */
	var MyLocation = {
		lat:null,
		lng:null,
		latlng:null,
		address:null
	};
	
	/**
	 * Holds the array of schedule (date) information
	 * @type array
	 */
	var Schedules = [];
	
	/**
	 * Schedule information for each day
	 * @type object
	 */
	function Schedule() {
		this.data = [];
	}
	
	/**
	 * Today's date
	 * @type object
	 */
	var date = new Date();
	
	/**
	 * Today's formatted date
	 * @type object
	 */
	var Today = {
		month:date.getMonth()+1,
		date:date.getDate(),
		year:date.getFullYear()
	};
	
	var schoolnames = [];
	
	var Schools = [];
	
	function School()
	{
		this.data = {};
		this.latlng = null;
		this.marker = null;
		this.infobox = null;
		this.infoboxtext = null;
		
		this.toggleInfoBox = function(Map,Marker,InfoBox) {
			return function(){
				if(InfoBox.visible)
				{
					InfoBox.close(Map,Marker);
				}
				else
				{
					InfoBox.open(Map,Marker);
				}
			};
		};
	}
	
	function FusionTable()
	{
		this.query = null;
		this.url = [];
	}

	//hide some stuff by Application
	$('#grp-mylocation,#grp-travel,#grp-time').hide();
	
	// The jQuery document.ready enclosure
	$(function(){
		
		// See if local storage has any values to fill in the form with
		if($.jStorage.storageAvailable())
		{
			$('#school').val($.jStorage.get('school',''));
			$('#mylocation').val($.jStorage.get('mylocation',''));
			var storageTravel = $.jStorage.get('travel','');
			if(storageTravel === 'WALKING')
			{
				$('#travel-walking').addClass('active');
			}
			else if(storageTravel === 'TRANSIT')
			{
				$('#travel-transit').addClass('active');
			}
			else if(storageTravel === 'DRIVING')
			{
				$('#travel-driving').addClass('active');
			}
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
			lat:Application.lat,
			lng:Application.lng,
			styles:Application.styles,
			zoom:Application.zoom
		});
		Map.initMap();
		
		// Pan/Zoom
		Map.setPanZoom(false);
		Map.setTouchScroll(true);
		var PanZoomControlDiv = document.createElement('div');
		var panZoomControl = new PanZoomControl(PanZoomControlDiv);
		PanZoomControlDiv.index = 1;
		Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(PanZoomControlDiv);
		
		// The School Schedule FT query
		var ScheduleFT = new FusionTable();
		ScheduleFT.query = encodeURIComponent(Application.schoolschedulequery);
		
		// Construct the School Location URL
		ScheduleFT.url = ['https://www.googleapis.com/fusiontables/v1/query'];
		ScheduleFT.url.push('?sql='+ScheduleFT.query);
		ScheduleFT.url.push('&key='+Application.googlemapsapikey);
		ScheduleFT.url.push('&callback=?');
		
		$.ajax({
			url: ScheduleFT.url.join(''),
			dataType: 'jsonp',
			success: function (ftdata) {
				
				var today = Today.month+'/'+Today.date+'/'+Today.year;
				
				for (var i in ftdata.rows)
				{
					Schedules[i] = new Schedule();
					for(var j in ftdata.columns)
					{
						var colname = ftdata.columns[j];
						Schedules[i].data[colname] = ftdata.rows[i][j];
					}
					
					if(Schedules[i].data.date === today)
					{
						Application.schooltoday = Schedules[i].data.unifiedcalendar;
						break;
					}
				}
				if(Application.schooltoday === 'Full Day')
				{
					$('#schedule').html('Yes - '+Application.schooltoday);
					$('#schedule').addClass('text-success');
				}
				else if(Application.schooltoday === 'No Schedule Available')
				{
					$('#schedule').html('We don\'t know - '+Application.schooltoday);
					$('#schedule').addClass('text-warning');
				}
				else
				{
					$('#schedule').html('No - '+Application.schooltoday);
					$('#schedule').addClass('text-error');
				}
			}
		});
		
		// The School Location FT query
		var SchoolFT = new FusionTable();
		SchoolFT.query = encodeURIComponent(Application.schoollocationquery);
		
		// Construct the School Location URL
		SchoolFT.url = ['https://www.googleapis.com/fusiontables/v1/query'];
		SchoolFT.url.push('?sql=' + SchoolFT.query);
		SchoolFT.url.push('&key='+Application.googlemapsapikey);
		SchoolFT.url.push('&callback=?');
		
		// Get the School Location FT data!
		$.ajax({
			url: SchoolFT.url.join(''),
			dataType: 'jsonp',
			success: function (ftdata) {
				// Copy the School Location data to the School object
				for (var i in ftdata.rows)
				{
					Schools[i] = new School();
					for(var j in ftdata.columns)
					{
						var colname = ftdata.columns[j];
						Schools[i].data[colname] = ftdata.rows[i][j];
					}
					// Push to the location names array the name of the schools
					// for the form input typeahead function
					schoolnames.push(Schools[i].data.shortname);
					// Create the Google LatLng object
					Schools[i].latlng = new google.maps.LatLng(ftdata.rows[i][0],ftdata.rows[i][1]);
					// Create the markers for each school
					Schools[i].marker = new google.maps.Marker({
						position: Schools[i].latlng,
						map: Map.Map,
						icon:'img/orange.png',
						shadow:'img/msmarker.shadow.png'
					});
					// Info boxes
					Schools[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(25,25,112); padding:5px; color:white; font-size:80%;">'+
					Schools[i].data.shortname+'<br />'+
					Schools[i].data.address+'<br />'+
					Schools[i].data.phone+'<br /></div>';
					var options = {
						content: Schools[i].infoboxtext,
						disableAutoPan: false,
						maxWidth: 0,
						pixelOffset: new google.maps.Size(-140, 0),
						zIndex: null,
						boxStyle: {
							background: "url('img/tipbox.gif') no-repeat",
							opacity: 0.9,
							width: "160px"
						},
						closeBoxMargin: "11px 4px 4px 4px",
						closeBoxURL: "img/close.gif",
						infoBoxClearance: new google.maps.Size(1, 1),
						visible: false,
						pane: "floatPane",
						enableEventPropagation: false
					};
					// Make the info box
					Schools[i].infobox = new InfoBox(options);
				}
				// Try to center on school in school input
				centeronschool();
				// Set up the typeahead for the school names.
				$('#school').typeahead({
					source:schoolnames,
					items:3,
					minLength:1
				});
			}
		});
		
		// FUNCTIONS -------------------------------------------------------------/
		
		// Center the map on the school in the school name input
		function centeronschool() {
			if($('#school').val() !== '')
			{
				for(var i in Schools)
				{
					if(Schools[i].data.shortname === $('#school').val())
					{
						Map.Map.setCenter(Schools[i].latlng);
						Schools[i].infobox.open(Map.Map,Schools[i].marker);
					}
					else
					{
						Schools[i].infobox.close(Map.Map,Schools[i].marker);
					}
				}
			}
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
						MyLocation.latlng = new google.maps.LatLng(
							position.coords.latitude,
							position.coords.longitude
						);
						// Find the address
						var geocoder = new google.maps.Geocoder();
						geocoder.geocode(
							{'latLng':MyLocation.latlng},
							function(results,status)
							{
								if (status === google.maps.GeocoderStatus.OK)
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
			controlUI.title = 'Click to interact with the map.';
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
				if(Map.Map.zoomControl === false)
				{
					Map.setPanZoom(true);
					Map.setTouchScroll(false);
					var cntr = Map.Map.getCenter();
					$('#before-map,#div-footer').hide(750,function(){
						$('#map-width').css('height','100%');
						$('#map-ratio').css('margin-top', window.innerHeight);
						$('#div-map').offset().top;
						controlUI.title = 'Click to close up the map.';
						controlText.innerHTML = 'Minimize';
						Map.Map.setCenter(cntr);
						google.maps.event.trigger(Map.Map, 'resize');
					});
					for(var i in Schools)
					{
						google.maps.event.addListener(Schools[i].marker, 'click', Schools[i].toggleInfoBox(Map.Map,Schools[i].marker,Schools[i].infobox));
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
						controlUI.title = 'Click to interact with the map.';
						controlText.innerHTML = 'Explore Map';
						Map.Map.setCenter(cntr);
						google.maps.event.trigger(Map.Map, 'resize');
					});
					for(var i in Schools)
					{
						google.maps.event.clearListeners(Schools[i].marker, 'click');
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
			if($('#mylocation').val() !== MyLocation.address)
			{
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode(
					{address:$('#mylocation').val()+', ' + Application.city + ', ' + Application.state},
					function(results, status)
					{
						if (status === google.maps.GeocoderStatus.OK)
						{
							if (results[0])
							{
								MyLocation.LatLng = results[0].geometry.location;
								MyLocation.lat = MyLocation.latlng.lat();
								MyLocation.lng = MyLocation.latlng.lng();
								MyLocation.address = $('#mylocation').val();
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
		
		// mylocation "next" button click
		$('#mylocation-next').click(function(){
			$('#grp-mylocation').hide();
			$('#grp-travel').show();
		});
		
		// travel "next" button click
		$('#time-next').click(function(){
			$('#grp-time').hide();
			//$('#grp-').show();
		});
		
		// travel change
		$('.travel').on('click', function() {
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('travel', $(this).val());
			}
		});
		
	});
	
})();