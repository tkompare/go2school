// The main.js enclosure
(function(){
	// Setup variables
	
	/**
	 * Default settings for this application
	 * @type object
	 */
	var Application = {
		city:'Chicago',
		directionsoptions:{
			suppressInfoWindows: true,
			polylineOptions: {
				strokeColor: '#0954cf',
				strokeWeight: '5',
				strokeOpacity: '.85'
			}},
		directionsrenderer:null,
		directionsservice:null,
		lat:41.85,
		lng:-87.675,
		state:'IL',
		styles:'grey minlabels',
		zoom:14,
		schooltoday:'No Schedule Available',
		schooltomorrow:'No Schedule Available',
		googlemapsapikey:'AIzaSyDH5WuL3gKYVBWVqLr6g3PQffdZE-XhBUw',
		schoolschedulequery:'SELECT date, dayofweek, unifiedcalendar FROM 1u765vIMSPecSEinBe1H6JPYSFE5ljbAW1Mq3okc',
		schoollocationquery:'SELECT lat, lng, longname, address, postalcode, phone, start, end, afterstart, afterend FROM 1qCOcgrhGwjt6bdx_UVPSkyIMMVD-1C7CJFvpIjI',
		scheduledatacolumns:null,
		scheduledatarows:null,
		schooldatacolumns:null,
		schooldatarows:null,
		schoolselected:null
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
	
	var tomorrowDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));
	
	var Tomorrow = {
		month:tomorrowDate.getMonth()+1,
		date:tomorrowDate.getDate(),
		year:tomorrowDate.getFullYear()
	}
	
	
	// timepicker
	$('#time').timepicker({
		 minuteStep: 5,
		 showInputs: false,
		 disableFocus:true,
		 template: 'modal',
		 modalBackdrop: true
	});
	
	var schoolnames = [];
	
	var Schools = [];
	
	function School()
	{
		this.data = {};
		this.latlng = null;
		this.marker = null;
		this.infobox = null;
		this.infoboxtext = null;
		
		this.toggleInfoBox = function(Map,Marker,InfoBox)
		{
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

	// hide some stuff to start with
	$('#grp-school,#grp-mylocation,#grp-travel,#grp-time,#grp-summary').hide();
	
	// The jQuery document.ready enclosure
	$(function(){
		
		// See if local storage has any values to fill in the form with
		if($.jStorage.storageAvailable())
		{
			$('#school').val($.jStorage.get('school',''));
			$('#summary-school').text($.jStorage.get('school',''));
			$('#time').val($.jStorage.get('time',''));
			$('#summary-time').text($.jStorage.get('time',''));
			$('#mylocation').val($.jStorage.get('mylocation',''));
			$('#summary-mylocation').text($.jStorage.get('mylocation',''));
			var storageTravel = $.jStorage.get('travel','');
			if(storageTravel === 'WALKING')
			{
				$('#travel-walking').addClass('active');
				$('#summary-travel').text('Walking');
				$('#travel-walking-icon').html('<i class="icon-ok icon-white"></i> ');

			}
			else if(storageTravel === 'TRANSIT')
			{
				$('#travel-transit').addClass('active');
				$('#summary-travel').text('CTA/Metra');
				$('#travel-transit-icon').html('<i class="icon-ok icon-white"></i> ');

			}
			else if(storageTravel === 'DRIVING')
			{
				$('#travel-driving').addClass('active');
				$('#summary-travel').text('Driving');
				$('#travel-driving-icon').html('<i class="icon-ok icon-white"></i> ');

			}
			Application.scheduledatacolumns = $.jStorage.get('scheduledatacolumns',null);
			Application.scheduledatarows = $.jStorage.get('scheduledatarows',null);
			Application.schooldatacolumns = $.jStorage.get('schooldatacolumns',null);
			Application.schooldatarows = $.jStorage.get('schooldatarows',null);
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
		
		//start up the google directions service and renderer
		Application.directionsservice = new google.maps.DirectionsService();
		Application.directionsrenderer = new google.maps.DirectionsRenderer(Application.directionsoptions);
		
		// Pan/Zoom
		Map.setPanZoom(false);
		Map.setTouchScroll(true);
		var PanZoomControlDiv = document.createElement('div');
		var panZoomControl = new PanZoomControl(PanZoomControlDiv);
		PanZoomControlDiv.index = 1;
		Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(PanZoomControlDiv);
		
		if(Application.scheduledatacolumns === null || Application.scheduledatarows === null)
		{
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
					if($.jStorage.storageAvailable())
					{
						$.jStorage.set('scheduledatacolumns',ftdata.columns);
						$.jStorage.set('scheduledatarows',ftdata.rows);
					}
					getSchedule(ftdata.columns,ftdata.rows);
				}
			});
		}
		else
		{
			getSchedule(Application.scheduledatacolumns,Application.scheduledatarows);
		}
		
		if(Application.schooldatacolumns === null || Application.schooldatarows === null)
		{
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
					
					if($.jStorage.storageAvailable())
					{
						$.jStorage.set('schooldatacolumns',ftdata.columns);
						$.jStorage.set('schooldatarows',ftdata.rows);
					}
					getSchools(ftdata.columns,ftdata.rows);
				}
			});
		}
		else
		{
			getSchools(Application.schooldatacolumns,Application.schooldatarows);
		}
		
		// FUNCTIONS -------------------------------------------------------------/
		
		function getSchools(columns,rows)
		{
			// Copy the School Location data to the School object
			for (var i in rows)
			{
				Schools[i] = new School();
				for(var j in columns)
				{
					var colname = columns[j];
					Schools[i].data[colname] = rows[i][j];
				}
				// Set the selected school, if there is one
				if($('#school').val() !== '' && Schools[i].data.longname === $('#school').val())
				{
					Application.schoolselected = Schools[i];
				}
				
				// Push to the location names array the name of the schools
				// for the form input typeahead function
				schoolnames.push(Schools[i].data.longname);
				// Create the Google LatLng object
				Schools[i].latlng = new google.maps.LatLng(Schools[i].data.lat,Schools[i].data.lng);
				// Create the markers for each school
				Schools[i].marker = new google.maps.Marker({
					position: Schools[i].latlng,
					map: Map.Map,
					icon:'img/orange.png',
					shadow:'img/msmarker.shadow.png'
				});
				// Info boxes
				var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
				Schools[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(25,25,112); padding:5px; color:white; font-size:80%;">'+
				Schools[i].data.longname+'<br />'+
				Schools[i].data.address+'<br />'+
				'<b><a href="tel:'+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'" style="color:white; font-size:125%; text-decoration:underline">'+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'</a></b><br /></div>';
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
					infoBoxClearance: new google.maps.Size(20, 30),
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
			window.scrollTo(0, 1);
		}
		
		function getSchedule(columns,rows)
		{
			for (var i in rows)
			{
				Schedules[i] = new Schedule();
				for(var j in columns)
				{
					var colname = columns[j];
					Schedules[i].data[colname] = rows[i][j];
				}
			}
			
			var today = Today.month+'/'+Today.date+'/'+Today.year;
			var tomorrow = Tomorrow.month+'/'+Tomorrow.date+'/'+Tomorrow.year;
			
			for(var i in Schedules)
			{
				if(Schedules[i].data.date === today)
				{
					Application.schooltoday = Schedules[i].data.unifiedcalendar;
				}
				if(Schedules[i].data.date === tomorrow)
				{
					Application.schooltomorrow = Schedules[i].data.unifiedcalendar;
				}
			}
			if(Application.schooltoday === 'Full Day')
			{
				$('#schedule').html(Application.schooltoday+' Today');
				$('#schedule').addClass('text-success');
			}
			else if(Application.schooltoday === 'No Schedule Available')
			{
				$('#schedule').html(Application.schooltoday+', so we don\'t know.');
				$('#schedule').addClass('text-warning');
			}
			else
			{
				$('#schedule').html(Application.schooltoday+' Today');
				$('#schedule').addClass('text-error');
			}
			if(Application.schooltomorrow === 'Full Day')
			{
				$('#schedule-tomorrow').html(Application.schooltomorrow+' Tomorrow');
				$('#schedule-tomorrow').addClass('text-success');
			}
			else if(Application.schooltomorrow === 'No Schedule Available')
			{
				$('#schedule-tomorrow').html(Application.schooltomorrow+', so we don\'t know.');
				$('#schedule-tomorrow').addClass('text-warning');
			}
			else
			{
				$('#schedule-tomorrow').html(Application.schooltomorrow+' Tomorrow');
				$('#schedule-tomorrow').addClass('text-error');
			}
		}
		
		// Center the map on the school in the school name input
		function centeronschool() {
			if($('#school').val() !== '')
			{
				for(var i in Schools)
				{
					if(Schools[i].data.longname === Application.schoolselected.data.longname)
					{
						$('#time-start-icon,#time-end-icon').text('');
						Map.Map.setCenter(Schools[i].latlng);
						Schools[i].infobox.open(Map.Map,Schools[i].marker);
						$('#time-start-time').text(' - '+formattime(Application.schoolselected.data.start));
						$('#time-end-time').text(' - '+formattime(Application.schoolselected.data.end));
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
		function mylocationgps()
		{
			function alertError()
			{
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
										$('#summary-mylocation').text(formattedAddress[0]);
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
		function PanZoomControl(controlDiv)
		{
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
		
		function formattime(time)
		{
			var meridian = 'AM';
			var timearray = time.split(':');
			var hour = timearray[0].length === 1 ? '0' + timearray[0] : timearray[0];
			if(hour === 12)
			{
				meridian = 'PM';
			}
			if(hour > 12)
			{
				hour = hour - 12;
				meridian = 'PM';
			}
			var minute = timearray[1];
			var timestring = hour+':'+minute+' '+meridian;
			return timestring;
		}
		// LISTENERS -------------------------------------------------------------/
		
		// school input onblur
		$('#school').blur(function(){
			centeronschool();
		});
		
		// find me button click
		$('#mylocation-gps').click(function(){
			mylocationgps();
		});
		
		// CHANGE -----------------------------------------------------------------
		
		// school input change
		$('#school').change(function(){
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('school', $('#school').val());
			}
			$('#summary-school').text($('#school').val());
			for(var i in Schools)
			{
				if(Schools[i].data.longname === $('#school').val())
				{
					Application.schoolselected = Schools[i];
					break;
				}
			}
			centeronschool();
		});
		
		// School Start button listener
		$('#time-start').click(function(){
			if(Application.schoolselected.data.start === '')
			{
				alert('No start time');
			}
			else
			{
				$('#time-end-icon').text('');
				$('#time-start-icon').html('<i class="icon-ok icon-white"></i> ');
				var timestring = formattime(Application.schoolselected.data.start);
				$('#time').timepicker('setTime', timestring);
				$('#summary-time').text(timestring);
				if($.jStorage.storageAvailable())
				{
					$.jStorage.set('time', timestring);
				}
			}
		});
		
		// School Start button listener
		$('#time-end').click(function(){
			if(Application.schoolselected.data.end === '')
			{
				alert('No end time');
			}
			else
			{
				$('#time-start-icon').text('');
				$('#time-end-icon').html('<i class="icon-ok icon-white"></i> ');
				var timestring = formattime(Application.schoolselected.data.end);
				$('#time').timepicker('setTime', timestring);
				$('#summary-time').text(timestring);
				if($.jStorage.storageAvailable())
				{
					$.jStorage.set('time', timestring);
				}
			}
		});
		
		// time change
		$('#time').timepicker().on('hide.timepicker', function() {
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('time', $('#time').val());
			}
			$('#summary-time').text($('#time').val());
			$('#time-start-icon,#time-end-icon').text('');
			$('#time-start,#time-end').removeClass('active');
		});
		
		
		
		// travel change
		$('.travel').on('click', function() {
			if($.jStorage.storageAvailable())
			{
				$.jStorage.set('travel', $(this).val());
			}
			if($(this).val() === 'WALKING')
			{
				$('#summary-travel').text('Walking');
				$('#travel-walking-icon').html('<i class="icon-ok icon-white"></i> ');
				$('#travel-transit-icon,#travel-driving-icon').text('');
			}
			else if($(this).val() === 'TRANSIT')
			{
				$('#summary-travel').text('CTA/Metra');
				$('#travel-transit-icon').html('<i class="icon-ok icon-white"></i> ');
				$('#travel-walking-icon,#travel-driving-icon').text('');
			}
			else if($(this).val() === 'DRIVING')
			{
				$('#summary-travel').text('Driving');
				$('#travel-driving-icon').html('<i class="icon-ok icon-white"></i> ');
				$('#travel-walking-icon,#travel-transit-icon').text('');
			}
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
			$('#summary-mylocation').text($('#mylocation').val());
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
		
		// NEXT BUTTONS -----------------------------------------------------------
		
		// intro "start" button click
		$('#intro-start').click(function(){
			$('#grp-intro').hide();
			$('#grp-school').show();
		});
		
		// school "next" button click
		$('#school-next').click(function(){
			$('#grp-school').hide();
			$('#grp-time').show();
		});
		
		// time "next" button click
		$('#time-next').click(function(){
			$('#grp-time').hide();
			$('#grp-travel').show();
		});
		
		// travel "next" button click
		$('#travel-next').click(function(){
			$('#grp-travel').hide();
			$('#grp-mylocation').show();
		});
		
		// mylocation "next" button click
		$('#mylocation-next').click(function(){
			$('#grp-mylocation').hide();
			$('#grp-summary').show();
		});
		
		// BACK BUTTONS -----------------------------------------------------------
		
		// time "back" button click
		$('#time-back').click(function(){
			$('#grp-time').hide();
			$('#grp-school').show();
		});
		
		// travel "back" button click
		$('#travel-back').click(function(){
			$('#grp-travel').hide();
			$('#grp-time').show();
		});
		
		// mylocation "back" button click
		$('#mylocation-back').click(function(){
			$('#grp-mylocation').hide();
			$('#grp-travel').show();
		});
		
		// summary "back" button click
		$('#summary-back').click(function(){
			$('#grp-summary').hide();
			$('#grp-mylocation').show();
		});
		
	});
	
})();