// The main.js enclosure
(function(){
	// Setup variables
	
	/**
	 * Default settings for this application
	 * @type object
	 */
	var Default = {
		// City name passed to Google for geolocation
		city:'Chicago',
		// Check icon when user clicks on a choice button
		check:'<i class="icon-ok icon-white"></i> ',
		// Google DirectionsRenderer options
		DirectionsOptions:{
			draggable:false,
			markerOptions:{
				zIndex:20000000
			},
			polylineOptions:{
				strokeColor: '#000',
				strokeWeight: '4',
				strokeOpacity: '.67',
				zIndex:20000000
			},
			suppressInfoWindows: true
		},
		// DOM ID of where the Google Map is rendered
		domid:'map',
		// Google Fusion Tables URI
		fturl:'https://www.googleapis.com/fusiontables/v1/query',
		// Start center latutude of the Google map
		lat:41.85,
		// Start center longitude of the Google map
		lng:-87.675,
		// State/Province name passed to Google for geolocation
		state:'IL',
		// Defined style types passed to TkMap
		styles:'grey minlabels',
		// Default message for today
		schooltoday:'No Schedule Available',
		// Default message for tomorrow
		schooltomorrow:'No Schedule Available',
		// Google maps API key
		googlemapsapikey:'AIzaSyDH5WuL3gKYVBWVqLr6g3PQffdZE-XhBUw',
		// Google Fusion Tables SQL-like query string for school schedule data
		schoolschedulequery:'SELECT date, dayofweek, unifiedcalendar FROM 1u765vIMSPecSEinBe1H6JPYSFE5ljbAW1Mq3okc',
		// Google Fusion Tables SQL-like query string for school location data
		schoollocationquery:'SELECT lat, lng, longname, address, postalcode, phone, start, end FROM 1qCOcgrhGwjt6bdx_UVPSkyIMMVD-1C7CJFvpIjI',
		// DOM ID target for the spinner
		spinnerTarget:document.getElementById('before-map'),
		// Local Storage prefix
		storagePrefix:'gro.sppaogacihc.loohcs2og-',
		// Bootstrap timepicker options
		TimepickerOptions:{
			minuteStep:5,
			showInputs:false,
			disableFocus:true,
			template:'modal',
			modalBackdrop:true
		},
		// Initial zoom level for the Google map
		zoom:14,
		// Spinner Options
		spinnerOpts:{
			lines: 13, // The number of lines to draw
			length: 7, // The length of each line
			width: 4, // The line thickness
			radius: 10, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			color: '#000', // #rgb or #rrggbb
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: 'auto', // Top position relative to parent in px
			left: 'auto' // Left position relative to parent in px
		}
	};
	
	/**
	 * Properties defined within the application
	 * @type object
	 */
	var Application = {
		// Google Directions Renderer
		DirectionsRenderer:null,
		// Google Directions Service
		DirectionsService:null,
		// The tkmap object
		Map:null,
		// The user's location information
		MyLocation:{
			lat:null,
			lng:null,
			LatLng:null,
			address:null
		},
		// Schedule data column names
		scheduledatacolumns:null,
		// Schedule data rows
		scheduledatarows:null,
		// School data column names
		schooldatacolumns:null,
		// School data rows
		schooldatarows:null,
		// The school currently selected
		SchoolSelected:null,
		// Today's Date mm/dd/yyyy
		today:null,
		// Tomorrow's Date
		tomorrow:null,
		// Google Traffic Layer
		traffic:null,
		// travel mode
		travelmode:null
	};
	
	/**
	 * Does this browser do local storage?
	 * @type boolean
	 */
	var localStorage = $.jStorage.storageAvailable();
	
	/**
	 *  Oh dear lord, browser detection. -10 Charisma
	 *  Is the browser android or iphone?
	 *  @type boolean
	 */
	var isPhone = (navigator.userAgent.match(/iPhone/i) || (navigator.userAgent.toLowerCase().indexOf("android") > -1)) ? true : false;
	
	/**
	 * Holds the array of schedule (date) information
	 * @type array
	 */
	var Schedules = [];
	
	var MySpinner = new Spinner(Default.spinnerOpts);
	/**
	 * Schedule information for each day
	 * @type class
	 */
	var Schedule = (function(){
		var constructor = function() {
			this.data = [];
		};
		return constructor;
	})();
	
	/**
	 * Date formatting class
	 * @type class
	 */
	var FormattedDate = (function(){
		var constructor = function(date)
		{
			this.month = date.getMonth()+1;
			this.date = date.getDate();
			this.year = date.getFullYear();
		};
		return constructor;
	})();
	
	/**
	 * Today's date
	 * @type object
	 */
	var TodayDate = new Date();
	
	/**
	 * Today's formatted date
	 * @type object
	 */
	var Today = new FormattedDate(TodayDate);
	
	/**
	 * Tomorrow's date
	 * @type object
	 */
	var TomorrowDate = new Date(TodayDate.getTime() + (86400000));
	
	/**
	 * Tomorrow's formatted date
	 * @type object
	 */
	var Tomorrow = new FormattedDate(TomorrowDate);
	
	/**
	 * Array of School names to be used in question drop-down
	 */
	var schoolnames = [];
	
	/**
	 * Array of School objects
	 * @type array
	 */
	var Schools = [];
	
	/**
	 * School class
	 * @type class
	 */
	var School = (function(){
		var constructor = function()
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
		};
		return constructor;
	})();
	
	/**
	 * Fusion Table connection
	 * @type class
	 */
	var FusionTable = (function(){
		var constructor = function()
		{
			this.query = null;
			this.url = [];
			
			this.populateUrl = function(fturl,query,googlemapsapikey)
			{
				this.url = [fturl];
				this.url.push('?sql='+query);
				this.url.push('&key='+googlemapsapikey);
				this.url.push('&callback=?');
			};
		};
		return constructor;
	})();
	
	// The jQuery document.ready enclosure
	$(function(){
		
		// FUNCTIONS -------------------------------------------------------------/
		
		// Format time string for text output
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
		
		// Center the map on the school in the school name input
		function centeronschool() {
			if($('#school').val() !== '')
			{
				for(var i in Schools)
				{
					if(Schools[i].data.longname === Application.SchoolSelected.data.longname)
					{
						//$('#time-start-icon,#time-end-icon').text('');
						Application.Map.Map.setCenter(Schools[i].latlng);
						Schools[i].infobox.open(Application.Map.Map,Schools[i].marker);
						var startTime = formattime(Application.SchoolSelected.data.start);
						var endTime = formattime(Application.SchoolSelected.data.end);
						// Set button time span text
						$('#time-start-time').text(' - '+startTime);
						$('#time-end-time').text(' - '+endTime);
						// If start of end time button was previously selected, assume the
						// user still wants to go to the new school at the start or end
						// time of the newly selected school.
						if($('#time-start').hasClass('active'))
						{
							$('#time,#summary-time').val(startTime);
							if(localStorage)
							{
								$.jStorage.set(Default.storagePrefix+'time',startTime);
							}
						}
						else if($('#time-end').hasClass('active'))
						{
							$('#time,#summary-time').val(endTime);
							if(localStorage)
							{
								$.jStorage.set(Default.storagePrefix+'time',endTime);
							}
						}
						// Check and uncheck in case old manually set time or current
						// (default) time happens to be the time of the start or end
						// time button.
						if(startTime === $('#time').val())
						{
							$('#time-end-icon').text('');
							$('#time-end').removeClass('active');
							$('#time-start-icon').html(Default.check);
							$('#time-start').addClass('active');
						}
						else if(endTime === $('#time').val())
						{
							$('#time-start-icon').text('');
							$('#time-start').removeClass('active');
							$('#time-end-icon').html(Default.check);
							$('#time-end').addClass('active');
						}
						else
						{
							$('#time-start-icon').text('');
							$('#time-start').removeClass('active');
							$('#time-end-icon').text('');
							$('#time-end').removeClass('active');
						}
						var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
						if(isPhone)
						{
							$('#sick-tel,#sick-tel-summary').html('<a class="btn btn-small btn-warning" style="margin-bottom:2px" href="tel:+1'+phone+'">Call: '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'</a>');
						}
						else
						{
							$('#sick-tel,#sick-tel-summary').html('<b>Call: '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'</b>');
						}
						$('#sick').show();
					}
					else
					{
						Schools[i].infobox.close(Application.Map.Map,Schools[i].marker);
					}
				}
			}
		}
		
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
				// Push to the location names array the name of the schools
				// for the form input typeahead function
				schoolnames.push(Schools[i].data.longname);
				// Create the Google LatLng object
				Schools[i].latlng = new google.maps.LatLng(Schools[i].data.lat,Schools[i].data.lng);
				// Create the markers for each school
				Schools[i].marker = new google.maps.Marker({
					position: Schools[i].latlng,
					map: Application.Map.Map,
					icon:'img/orange.png',
					shadow:'img/msmarker.shadow.png'
				});
				// Info boxes
				var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
				Schools[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(25,25,112); padding:5px; color:white; font-size:80%;">'+
				Schools[i].data.longname+'<br />'+
				Schools[i].data.address+'<br />'+
				phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'<br /></div>';
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
				// Set the selected school, if the school name entered matchs the longname
				if($('#school').val() !== '' && Schools[i].data.longname === $('#school').val())
				{
					Application.SchoolSelected = Schools[i];
				}
			}
			if(Application.SchoolSelected === null)
			{
				var regex = new RegExp($('#school').val(),'gi');
				for(var i in Schools)
				{
					if(Schools[i].data.longname.match(regex))
					{
						Application.SchoolSelected = Schools[i];
						break;
					}
				}
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
			
			Application.today = Today.month+'/'+Today.date+'/'+Today.year;
			Application.tomorrow = Tomorrow.month+'/'+Tomorrow.date+'/'+Tomorrow.year;
			
			for(var i in Schedules)
			{
				if(Schedules[i].data.date === Application.today)
				{
					Default.schooltoday = Schedules[i].data.unifiedcalendar;
				}
				else if(Schedules[i].data.date === Application.tomorrow)
				{
					Default.schooltomorrow = Schedules[i].data.unifiedcalendar;
				}
			}
			function checkSchedule(dateType,date,domId)
			{
				if(dateType === 'Full Day')
				{
					$('#'+domId).html(dateType+' '+date);
				}
				else if(dateType === 'No Schedule Available')
				{
					$('#'+domId).html(dateType).addClass('muted');
				}
				else
				{
					$('#schedule').html(dateType+' '+date).addClass('text-warning');
				}
			}
			checkSchedule(Default.schooltoday,'Today','schedule');
			checkSchedule(Default.schooltomorrow,'Tomorrow','schedule-tomorrow');
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
		// Check my location for enabling next button
		function checkMyLocation()
		{
			if($('#mylocation').val().length > 0)
			{
				$('#mylocation-next').removeClass('disabled').removeAttr('disabled');
			}
			else
			{
				if($('#mylocation-next').hasClass('disabled') === false)
				{
					$('#mylocation-next').addClass('disabled');
				}
				$('#mylocation-next').attr('disabled','disabled');
			}
		}
		
		// Get address from GPS
		function mylocationgps()
		{
			function alertError()
			{
				alert('We\'re sorry. We could not find an address for this location.');
			}
			if(navigator.geolocation)
			{
				// grab the lat/lng
				MySpinner.spin(Default.spinnerTarget);
				navigator.geolocation.getCurrentPosition(
					function(position)
					{
						MySpinner.stop();
						Application.MyLocation.lat = position.coords.latitude;
						Application.MyLocation.lng = position.coords.longitude;
						Application.MyLocation.LatLng = new google.maps.LatLng(
							position.coords.latitude,
							position.coords.longitude
						);
						// Find the address
						var geocoder = new google.maps.Geocoder();
						geocoder.geocode(
							{'latLng':Application.MyLocation.LatLng},
							function(results,status)
							{
								if (status === google.maps.GeocoderStatus.OK)
								{
									if (results[1])
									{
										var formattedAddress = results[0].formatted_address.split(',');
										Application.MyLocation.address = formattedAddress[0];
										$('#mylocation').val(formattedAddress[0]);
										$('#mylocation').blur();
										$('#summary-mylocation').text(formattedAddress[0]);
										if(localStorage)
										{
											$.jStorage.set(Default.storagePrefix+'mylocation', formattedAddress[0]);
										}
										checkMyLocation();
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
						MySpinner.stop();
						// Can't find the address
						handleNoGeolocation(true);
					},
					{timeout:8000, enableHighAccuracy:true}
				);
			}
			else
			{
				// Browser doesn't support Geolocation
				handleNoGeolocation(false);
			}
		}
		
		// Put a Pan/Zoom control on the map
		function panZoomControl(controlDiv)
		{
			// Set CSS styles for the DIV containing the control
			// Setting padding to 5 px will offset the control
			// from the edge of the map.
			controlDiv.style.padding = '1em';
			// Set CSS for the control border.
			var controlUI = document.createElement('div');
			controlUI.style.backgroundColor = '#000080';
			controlUI.style.color = 'white';
			controlUI.style.borderStyle = 'solid';
			controlUI.style.borderWidth = '0px';
			controlUI.style.cursor = 'pointer';
			controlUI.style.textAlign = 'center';
			controlUI.style.borderRadius = '6px';
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
				var cntr = Application.Map.Map.getCenter();
				if(Application.Map.Map.zoomControl === false)
				{
					Application.Map.setPanZoom(true);
					Application.Map.setTouchScroll(false);
					$('#before-map,#div-footer,#grp-directions').hide(750,function(){
						$('#map-width').css('height','100%');
						$('#map-ratio').css('margin-top', window.innerHeight);
						controlUI.title = 'Click to close up the map.';
						controlText.innerHTML = 'Minimize';
						Application.Map.Map.setCenter(cntr);
						google.maps.event.trigger(Application.Map.Map, 'resize');
					});
					for(var i in Schools)
					{
						google.maps.event.addListener(Schools[i].marker, 'click', Schools[i].toggleInfoBox(Application.Map.Map,Schools[i].marker,Schools[i].infobox));
					}
				}
				else
				{
					Application.Map.setPanZoom(false);
					Application.Map.setTouchScroll(true);
					$('#before-map,#div-footer,#grp-directions').show(750,function(){
						$('#map-width').css('height','');
						$('#map-ratio').css('margin-top','200px');
						controlUI.title = 'Click to interact with the map.';
						controlText.innerHTML = 'Explore Map';
						Application.Map.Map.setCenter(cntr);
						google.maps.event.trigger(Application.Map.Map, 'resize');
						window.scrollTo(0, 1);
					});
					for(var i in Schools)
					{
						google.maps.event.clearListeners(Schools[i].marker, 'click');
					}
				}
			});
		}
		
		function setSchool(Schools,regex)
		{
			for(var i in Schools)
			{
				if(Schools[i].data.longname.match(regex))
				{
					Application.SchoolSelected = Schools[i];
					$('#summary-school').text(Schools[i].data.longname);
					$('#school').val(Schools[i].data.longname);
					var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
					$('#sick-tel,#sick-tel-summary').text('Call: '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4));
					$('#sick').show();
					if(localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'school', $('#school').val());
					}
					break;
				}
			}
		}
		
		function route()
		{
			// Start up the google directions service and renderer
			if(Application.DirectionsRenderer !== null)
			{
				Application.DirectionsRenderer.setMap(null);
			}
			Application.DirectionsService = new google.maps.DirectionsService();
			Application.DirectionsRenderer = new google.maps.DirectionsRenderer(Default.DirectionsOptions);
			
			var userTime = $('#time').val().replace(/\s/g,'');
			// Google directions service doesn't seem to like midnight or noon with
			// an AM/PM attached.
			if(userTime === '12:00AM')
			{
				userTime = '00:00';
			}
			else if(userTime === '12:00PM')
			{
				userTime = '12:00';
			}
			var unixtime = null;
			if($('#summary-date').text() === 'Today')
			{
				unixtime = Date.parse(Application.today+' '+userTime).getTime();
			}
			else if($('#summary-date').text() === 'Tomorrow')
			{
				unixtime = Date.parse(Application.tomorrow+' '+userTime).getTime();
			}
			var transitOptions = {
				// subtract 10 minutes so the user has a bit of a real-life buffer.
				arrivalTime : new Date(unixtime - 600000)
			};
			var RouteRequest = null;
			if(Application.travelmode === 'TRANSIT')
			{
				RouteRequest = {
					origin : $('#mylocation').val()+', ' + Default.city + ', ' + Default.state,
					destination : Application.SchoolSelected.data.address+', '+Default.city+', '+Default.state+' '+Application.SchoolSelected.data.postalcode,
					transitOptions : transitOptions,
					travelMode: google.maps.TravelMode.TRANSIT
				};
			}
			else if(Application.travelmode === 'WALKING')
			{
				RouteRequest = {
					origin : $('#mylocation').val()+', ' + Default.city + ', ' + Default.state,
					destination : Application.SchoolSelected.data.address+', '+Default.city+', '+Default.state+' '+Application.SchoolSelected.data.postalcode,
					transitOptions : transitOptions,
					travelMode: google.maps.TravelMode.WALKING
				};
			}
			else
			{
				RouteRequest = {
					origin : $('#mylocation').val()+', ' + Default.city + ', ' + Default.state,
					destination : Application.SchoolSelected.data.address+', '+Default.city+', '+Default.state+' '+Application.SchoolSelected.data.postalcode,
					transitOptions : transitOptions,
					travelMode: google.maps.TravelMode.DRIVING
				};
			}
			Application.DirectionsService.route(RouteRequest, function(Response, Status)
				{
					if (Status === google.maps.DirectionsStatus.OK)
					{
						$('#grp-directions').html('<div id=timetoleave class="span12 center"></div><div id=directions class="span8 offset2"></div>');
						$('#grp-directions').addClass('padded');
						$('#grp-directions').show();
						Application.DirectionsRenderer.setMap(Application.Map.Map);
						Application.DirectionsRenderer.setPanel(document.getElementById('directions'));
						var route = 0;
						for(var i=0; i<Response.routes.length; i++)
						{
							for(var j=0; j<Response.routes[i].legs[0].steps.length; j++)
							{
								if(Response.routes[i].legs[0].steps[j].travel_mode === Application.travelmode)
								{
									route = i;
									break;
								}
							}
							delete Response.routes[i].warnings;
							Response.routes[i].copyrights = '';
						}
						for(var i in Schools)
						{
							Schools[i].marker.setMap(null);
						}
						Application.DirectionsRenderer.setDirections(Response);
						if(Application.travelmode === 'TRANSIT')
						{
							$('#timetoleave').html('<h4>Leave '+$('#summary-date').text()+' by '+Response.routes[route].legs[0].departure_time.text+'</h4>');
						}
						else
						{
							var milleseconds = Response.routes[route].legs[0].duration.text.match(/^[0-9]+/) * 60000;
							// Subtract 10 minutes so no one is late.
							var unixtimeLeaveBy = unixtime - milleseconds  - 600000;
							var LeaveByDate = new Date(unixtimeLeaveBy);
							var ampm = 'AM';
							var hour = LeaveByDate.getHours();
							if (hour > 12)
							{
								hour = hour - 12;
								ampm = 'PM';
							}
							else if(hour < 1)
							{
								hour = 12;
							}
							else
							{
								ampm = 'PM';
							}
							var minute = LeaveByDate.getMinutes();
							var leaveByDateString = hour+':'+minute+' '+ampm;
							$('#timetoleave').html('<h4>Leave '+$('#summary-date').text()+' by '+leaveByDateString+'</h4>');
						}
						if(Application.travelmode === 'TRANSIT' || Application.travelmode === 'DRIVING')
						{
							if(Application.traffic === null)
							{
								Application.traffic = new google.maps.TrafficLayer();
							}
							Application.traffic.setMap(Application.Map.Map);
						}
						else
						{
							if(Application.traffic !== null)
							{
								Application.traffic.setMap(null);
							}
						}
						
					}
					else
					{
						if(typeof Application.DirectionsRenderer !== 'undefined')
						{
							Application.DirectionsRenderer.setMap(null);
						}
						$('#directions').html('<p><b>We are sorry. We cannot route you to this school.</b> It is likely that your local transit authority has not released schedule times. Please check back soon.</p>');
					}
				});
		}
		
		// SET_UP AND START UP -----------------------------------------------------

		// See if local storage has any values to fill in the form with
		var storageDate = '';
		var storageTravel = '';
		if(localStorage)
		{
			$('#school').val($.jStorage.get(Default.storagePrefix+'school',''));
			$('#summary-school').text($.jStorage.get(Default.storagePrefix+'school',''));
			$('#time').val($.jStorage.get(Default.storagePrefix+'time',''));
			$('#summary-time').text($.jStorage.get(Default.storagePrefix+'time',''));
			$('#mylocation').val($.jStorage.get(Default.storagePrefix+'mylocation',''));
			$('#summary-mylocation').text($.jStorage.get(Default.storagePrefix+'mylocation',''));
			storageDate = $.jStorage.get(Default.storagePrefix+'date','');
			storageTravel = $.jStorage.get(Default.storagePrefix+'travel','');
			Application.scheduledatacolumns = $.jStorage.get(Default.storagePrefix+'scheduledatacolumns',null);
			Application.scheduledatarows = $.jStorage.get(Default.storagePrefix+'scheduledatarows',null);
			Application.schooldatacolumns = $.jStorage.get(Default.storagePrefix+'schooldatacolumns',null);
			Application.schooldatarows = $.jStorage.get(Default.storagePrefix+'schooldatarows',null);
			
			// Apply the date; today or tomorrow?
			if(storageDate === 'today')
			{
				$('#date-today').addClass('active');
				$('#summary-date').text('Today');
				$('#date-today-icon').html(Default.check);
			}
			if(storageDate === 'tomorrow')
			{
				$('#date-tomorrow').addClass('active');
				$('#summary-date').text('Tomorrow');
				$('#date-tomorrow-icon').html(Default.check);
			}
			
			// Apply the travel type
			Application.travelmode = storageTravel;
			if(storageTravel === 'WALKING')
			{
				$('#travel-walking').addClass('active');
				$('#summary-travel').text('Walking');
				$('#travel-walking-icon').html(Default.check);

			}
			else if(storageTravel === 'TRANSIT')
			{
				$('#travel-transit').addClass('active');
				$('#summary-travel').text('CTA/Metra');
				$('#travel-transit-icon').html(Default.check);

			}
			else if(storageTravel === 'DRIVING')
			{
				$('#travel-driving').addClass('active');
				$('#summary-travel').text('Driving');
				$('#travel-driving-icon').html(Default.check);
			}
		}
		
		// If the form is completely filled out, go straight to the summary view
		if($('#school').val() !== '' && $('#time').val() !== '' && storageDate !== '' && $('#mylocation').val() !== '' && storageTravel !== '')
		{
			$('#grp-intro').hide();
			$('#grp-summary').show();
		}
		// Disable next buttons when form fields are empty
		if($('#school').val() === '')
		{
			$('#school-next').addClass('disabled').attr('disabled','disabled');
		}
		if(storageDate === '' || $('#time').val() === '')
		{
			$('#time-next').addClass('disabled').attr('disabled','disabled');
		}
		if(storageTravel === '')
		{
			$('#travel-next').addClass('disabled').attr('disabled','disabled');
		}
		if($('#mylocation').val() === '')
		{
			$('#mylocation-next').addClass('disabled').attr('disabled','disabled');
		}
		
	// Set up the timepicker - bootstrap-timepicker.js
		$('#time').timepicker(Default.TimepickerOptions);
		
		// Set up the loading message
		//$('#loading').hide();
		$(document).ajaxStart(function() {
			//$('#loading').show();
			MySpinner.spin(Default.spinnerTarget);
		})
		.ajaxStop(function() {
			//$('#loading').hide();
			MySpinner.stop();
		});
		
		// The Google map base layer object
		Application.Map = new TkMap({
			domid:Default.domid,
			lat:Default.lat,
			lng:Default.lng,
			styles:Default.styles,
			zoom:Default.zoom
		});
		Application.Map.initMap();
		
		// Pan/Zoom
		Application.Map.setPanZoom(false);
		Application.Map.setTouchScroll(true);
		var PanZoomControlDiv = document.createElement('div');
		panZoomControl(PanZoomControlDiv);
		PanZoomControlDiv.index = 1;
		Application.Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(PanZoomControlDiv);
		
		if(Application.scheduledatacolumns === null || Application.scheduledatarows === null)
		{
			// The School Schedule FT query
			var ScheduleFT = new FusionTable();
			ScheduleFT.query = encodeURIComponent(Default.schoolschedulequery);
			
			// Construct the School Location URL
			ScheduleFT.populateUrl(Default.fturl,ScheduleFT.query,Default.googlemapsapikey);
			
			$.ajax({
				url: ScheduleFT.url.join(''),
				dataType: 'jsonp',
				success: function (ftdata) {
					if(localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'scheduledatacolumns',ftdata.columns);
						$.jStorage.set(Default.storagePrefix+'scheduledatarows',ftdata.rows);
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
			SchoolFT.query = encodeURIComponent(Default.schoollocationquery);
			
			// Construct the School Location URL
			SchoolFT.populateUrl(Default.fturl,SchoolFT.query,Default.googlemapsapikey);
			
			// Get the School Location FT data!
			$.ajax({
				url: SchoolFT.url.join(''),
				dataType: 'jsonp',
				success: function (ftdata) {
					if(localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'schooldatacolumns',ftdata.columns);
						$.jStorage.set(Default.storagePrefix+'schooldatarows',ftdata.rows);
					}
					getSchools(ftdata.columns,ftdata.rows);
				}
			});
		}
		else
		{
			getSchools(Application.schooldatacolumns,Application.schooldatarows);
		}
		
		// LISTENERS --------------------------------------------------------------
		
		// find me button click
		$('#mylocation-gps').click(function(){
			mylocationgps();
		});
		
		// school input change
		$('#school').change(function(){
			$('#summary-school').text($('#school').val());
			if(localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'school',$('#school').val());
			}
			Application.SchoolSelected = null;
			for(var i in Schools)
			{
				if(Schools[i].data.longname === $('#school').val())
				{
					Application.SchoolSelected = Schools[i];
					var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
					$('#sick-tel,#sick-tel-summary').text('Call: '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4));
					$('#sick').show();
					break;
				}
			}
			// begins with
			var regex;
			if(Application.SchoolSelected === null)
			{
				regex = new RegExp('^'+$('#school').val(),'i');
				setSchool(Schools,regex);
			}
			// case sensitive
			if(Application.SchoolSelected === null)
			{
				regex = new RegExp($('#school').val(),'g');
				setSchool(Schools,regex);
			}
			// case insensitive
			if(Application.SchoolSelected === null)
			{
				regex = new RegExp($('#school').val(),'gi');
				setSchool(Schools,regex);
			}
			if($('#school').val().length > 0 && Application.SchoolSelected !== null)
			{
				$('#school-next').removeClass('disabled').removeAttr('disabled');
			}
			else
			{
				$('#school-next').addClass('disabled').attr('disabled','disabled');
			}
			centeronschool();
		});
		
		// date-time screen function
		function dateTimeNext() {
			if($('#summary-date').text().length > 0 && $('#time').val() !== '')
			{
				$('#time-next').removeClass('disabled').removeAttr('disabled');
			}
		}
		
		// Today Button Listener
		$('.date').on('click', function() {
			if(localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'date', $(this).val());
			}
			if($(this).val() === 'today')
			{
				$('#summary-date').text('Today');
				$('#date-today-icon').html(Default.check);
				$('#date-tomorrow-icon').text('');
			}
			else if($(this).val() === 'tomorrow')
			{
				$('#summary-date').text('Tomorrow');
				$('#date-tomorrow-icon').html(Default.check);
				$('#date-today-icon').text('');
			}
			dateTimeNext();
		});
		
		// School Start button listener
		$('#time-start').click(function(){
			if(Application.SchoolSelected.data.start === '')
			{
				alert('No start time');
			}
			else
			{
				$('#time-end-icon').text('');
				$('#time-start-icon').html(Default.check);
				var timestring = formattime(Application.SchoolSelected.data.start);
				$('#time').timepicker('setTime', timestring);
				$('#summary-time').text(timestring);
				if(localStorage)
				{
					$.jStorage.set(Default.storagePrefix+'time', timestring);
				}
			}
			dateTimeNext();
		});
		
		// School End button listener
		$('#time-end').click(function(){
			if(Application.SchoolSelected.data.end === '')
			{
				alert('No end time');
			}
			else
			{
				$('#time-start-icon').text('');
				$('#time-end-icon').html(Default.check);
				var timestring = formattime(Application.SchoolSelected.data.end);
				$('#time').timepicker('setTime', timestring);
				$('#summary-time').text(timestring);
				if(localStorage)
				{
					$.jStorage.set(Default.storagePrefix+'time', timestring);
				}
			}
			dateTimeNext();
		});
		
		// time change
		$('#time').timepicker().on('hide.timepicker', function() {
			if(localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'time', $('#time').val());
			}
			$('#summary-time').text($('#time').val());
			$('#time-start-icon,#time-end-icon').text('');
			$('#time-start,#time-end').removeClass('active');
			dateTimeNext();
		});
		
		// travel change
		$('.travel').on('click', function() {
			Application.travelmode = $(this).val();
			if(localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'travel', $(this).val());
			}
			if($(this).val() === 'WALKING')
			{
				$('#summary-travel').text('Walking');
				$('#travel-walking-icon').html(Default.check);
				$('#travel-transit-icon,#travel-driving-icon').text('');
			}
			else if($(this).val() === 'TRANSIT')
			{
				$('#summary-travel').text('CTA/Metra');
				$('#travel-transit-icon').html(Default.check);
				$('#travel-walking-icon,#travel-driving-icon').text('');
			}
			else if($(this).val() === 'DRIVING')
			{
				$('#summary-travel').text('Driving');
				$('#travel-driving-icon').html(Default.check);
				$('#travel-walking-icon,#travel-transit-icon').text('');
			}
			$('#travel-next').removeClass('disabled').removeAttr('disabled');
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
			if(localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'mylocation', $('#mylocation').val());
			}
			$('#summary-mylocation').text($('#mylocation').val());
			if($('#mylocation').val() !== Application.MyLocation.address)
			{
				var geocoder = new google.maps.Geocoder();
				geocoder.geocode(
					{address:$('#mylocation').val()+', ' + Default.city + ', ' + Default.state},
					function(results, status)
					{
						if (status === google.maps.GeocoderStatus.OK)
						{
							if (results[0])
							{
								Application.MyLocation.LatLng = results[0].geometry.location;
								Application.MyLocation.lat = Application.MyLocation.LatLng.lat();
								Application.MyLocation.lng = Application.MyLocation.LatLng.lng();
								Application.MyLocation.address = $('#mylocation').val();
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
			checkMyLocation();
		});
		
		// NEXT AND BACK BUTTONS --------------------------------------------------
		
		/**
		 * hide DOM IDs then show DOM IDs
		 */
		function hideshow(hide,show)
		{
			return function()
			{
				$('#grp-'+hide).hide();
				$('#grp-'+show).show();
				window.scrollTo(0, 1);
			};
		}
		
		// intro "start" button click
		$('#intro-start').click(hideshow('intro,#isschool','school'));
		
		// school "next" button click
		$('#school-next').click(hideshow('school','time'));
		
		// time "next" button click
		$('#time-next').click(hideshow('time','travel'));
		
		// travel "next" button click
		$('#travel-next').click(hideshow('travel','mylocation'));
		
		// mylocation "next" button click
		$('#mylocation-next').click(hideshow('mylocation','summary,#isschool'));
		
		// time "back" button click
		$('#time-back').click(hideshow('time','school'));
		
		// travel "back" button click
		$('#travel-back').click(hideshow('travel','time'));
		
		// mylocation "back" button click
		$('#mylocation-back').click(hideshow('mylocation','travel'));
		
		// SUMMARY BUTTONS --------------------------------------------------------
		function summarybtn(grp)
		{
			return function(){
				$('#grp-summary,#isschool').hide();
				$('#grp-'+grp).show();
				$('#grp-directions').html('');
				$('grp-directions').removeClass('center padded');
				if(Application.traffic !== null)
				{
					Application.traffic.setMap(null);
				}
				if(Application.DirectionsRenderer !== null)
				{
					Application.DirectionsRenderer.setMap(null);
				}
				for(var i in Schools)
				{
					Schools[i].marker.setMap(Application.Map.Map);
				}
				Application.Map.Map.panTo(Application.SchoolSelected.latlng);
				Application.Map.Map.setZoom(Default.zoom);
				window.scrollTo(0, 1);
			};
		}
		
		$('#summary-school-btn').click(summarybtn('school'));
		
		$('#summary-time-btn').click(summarybtn('time'));
		
		$('#summary-travel-btn').click(summarybtn('travel'));
		
		$('#summary-mylocation-btn').click(summarybtn('mylocation'));
		
		// GO! BUTTON
		
		$('#summary-go').click(function(){
			route();
		});
	
	});
	
})();