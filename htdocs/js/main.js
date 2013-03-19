(function(){
	
	// Application properties
	var Application = new GoToSchool();
	
	// The jQuery document.ready 
	$(function(){
		
		// Today's date
		var TodayDate = new Date();
		
		// Today's formatted date
		var Today = new FormattedDate(TodayDate);
		
		// Tomorrow's date
		var TomorrowDate = new Date(TodayDate.getTime() + (86400000));
		
		// Tomorrow's formatted date
		var Tomorrow = new FormattedDate(TomorrowDate);
		
		// Spinner
		var MySpinner = new Spinner(Default.spinnerOpts);
		
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
				for(var i in Application.Schools)
				{
					if(Application.Schools[i].data.longname === Application.SchoolSelected.data.longname)
					{
						Application.Map.Map.setCenter(Application.Schools[i].latlng);
						Application.Schools[i].infobox.open(Application.Map.Map,Application.Schools[i].marker);
						var startTime = '12:00 PM';
						if(Application.SchoolSelected.data.start.length > 0)
						{
							startTime = formattime(Application.SchoolSelected.data.start);
							$('#time-nobtns').hide();
						}
						var endTime = '12:00 PM';
						if(Application.SchoolSelected.data.end.length > 0)
						{
							endTime = formattime(Application.SchoolSelected.data.end);
						}
						else
						{
							$('#time,#summary-time').val('12:00 PM');
						}
						// Set button time span text
						$('#time-start-time').text(' - '+startTime);
						$('#time-end-time').text(' - '+endTime);
						// If start of end time button was previously selected, assume the
						// user still wants to go to the new school at the start or end
						// time of the newly selected school.
						if($('#time-start').hasClass('active'))
						{
							$('#time,#summary-time').val(startTime);
							if(Application.localStorage)
							{
								$.jStorage.set(Default.storagePrefix+'time',startTime);
							}
						}
						else if($('#time-end').hasClass('active'))
						{
							$('#time,#summary-time').val(endTime);
							if(Application.localStorage)
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
						var phone = String(Application.Schools[i].data.phone).replace('/[^0-9]/','');
						if(Application.isPhone)
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
						Application.Schools[i].infobox.close(Application.Map.Map,Application.Schools[i].marker);
					}
				}
			}
		}
		
		function getSchools(columns,rows)
		{
			// Copy the School Location data to the School object
			for (var i in rows)
			{
				Application.Schools[i] = new School();
				for(var j in columns)
				{
					var colname = columns[j];
					Application.Schools[i].data[colname] = rows[i][j];
				}
				// Push to the location names array the name of the schools
				// for the form input typeahead function
				Application.schoolnames.push(Application.Schools[i].data.longname);
				// Create the Google LatLng object
				Application.Schools[i].latlng = new google.maps.LatLng(Application.Schools[i].data.lat,Application.Schools[i].data.lng);
				// Create the markers for each school
				Application.Schools[i].marker = new google.maps.Marker({
					position: Application.Schools[i].latlng,
					map: Application.Map.Map,
					icon:'img/orange.png',
					shadow:'img/msmarker.shadow.png'
				});
				// Info boxes
				var phone = String(Application.Schools[i].data.phone).replace('/[^0-9]/','');
				Application.Schools[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(1,82,137); padding:5px; color:white; font-size:90%;">'+
				Application.Schools[i].data.longname+'<br />'+
				Application.Schools[i].data.address+'<br />'+
				phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'<br /></div>';
				var options = Default.infoboxoptions;
				options.content = Application.Schools[i].infoboxtext;
				// Make the info box
				Application.Schools[i].infobox = new InfoBox(options);
				// Set the selected school, if the school name entered matchs the longname
				if($('#school').val() !== '' && Application.Schools[i].data.longname === $('#school').val())
				{
					Application.SchoolSelected = Application.Schools[i];
				}
			}
			if(Application.SchoolSelected === null)
			{
				var regex = new RegExp($('#school').val(),'gi');
				for(var i in Application.Schools)
				{
					if(Application.Schools[i].data.longname.match(regex))
					{
						Application.SchoolSelected = Application.Schools[i];
						break;
					}
				}
			}
			// Try to center on school in school input
			centeronschool();
			// Set up the typeahead for the school names.
			$('#school').typeahead({
				source:Application.schoolnames,
				items:3,
				minLength:1
			});
			window.scrollTo(0, 1);
		}
		
		function getSafe(columns,rows)
		{
			// Copy the Safe Location data to the School object
			for (var i in rows)
			{
				Application.SafeLocations[i] = new MapLocation();
				for(var j in columns)
				{
					var colname = columns[j];
					Application.SafeLocations[i].data[colname] = rows[i][j];
				}
				// Create the Google LatLng object
				Application.SafeLocations[i].latlng = new google.maps.LatLng(Application.SafeLocations[i].data.lat,Application.SafeLocations[i].data.lng);
				// Create the markers for each school
				if(Application.SafeLocations[i].data.type === 'police station')
				{
					Application.SafeLocations[i].marker = new google.maps.Marker({
						position: Application.SafeLocations[i].latlng,
						map: Application.Map.Map,
						icon:'img/police.png'
					});
				}
				else if (Application.SafeLocations[i].data.type === 'fire station')
				{
					Application.SafeLocations[i].marker = new google.maps.Marker({
						position: Application.SafeLocations[i].latlng,
						map: Application.Map.Map,
						icon:'img/fire.png'
					});
				}
				else if (Application.SafeLocations[i].data.type === 'hospital')
				{
					Application.SafeLocations[i].marker = new google.maps.Marker({
						position: Application.SafeLocations[i].latlng,
						map: Application.Map.Map,
						icon:'img/hosp.png'
					});
				}
				else
				{
					Application.SafeLocations[i].marker = new google.maps.Marker({
						position: Application.SafeLocations[i].latlng,
						map: Application.Map.Map
					});
				}
				// Info boxes
				var phone = String(Application.SafeLocations[i].data.phone).replace(/[^0-9]/g,'');
				Application.SafeLocations[i].infoboxtext = '<div class="infoBox" style="border:2px solid rgb(0,0,0); margin-top:8px; background:rgb(82,82,82); padding:5px; color:white; font-size:90%;">'+
				Application.SafeLocations[i].data.name+'<br>'+
				Application.SafeLocations[i].data.address+'<br>';
				if(phone !== '')
				{
					Application.SafeLocations[i].infoboxtext = Application.SafeLocations[i].infoboxtext + phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4)+'<br>';
				}
				Application.SafeLocations[i].infoboxtext = Application.SafeLocations[i].infoboxtext + '</div>';
				var options = Default.infoboxoptions;
				options.content = Application.SafeLocations[i].infoboxtext;
				// Make the info box
				Application.SafeLocations[i].infobox = new InfoBox(options);
			}
			window.scrollTo(0, 1);
			
			google.maps.event.addListener(Application.Map.Map, 'zoom_changed', function() {
				if(Application.Map.Map.getZoom() > 13)
				{
					for(var i in Application.SafeLocations)
					{
						if(Application.SafeLocations[i].marker.getVisible() === false)
						{
							Application.SafeLocations[i].marker.setVisible(true);
						}
					}
				}
				else
				{
					for(var i in Application.SafeLocations)
					{
						if(Application.SafeLocations[i].marker.getVisible() === true)
						{
							Application.SafeLocations[i].marker.setVisible(false);
						}
					}
				}
				
			});
		}
		
		function getSchedule(columns,rows)
		{
			for (var i in rows)
			{
				Application.Schedules[i] = new Schedule();
				for(var j in columns)
				{
					var colname = columns[j];
					Application.Schedules[i].data[colname] = rows[i][j];
				}
			}
			
			Application.today = Today.month+'/'+Today.date+'/'+Today.year;
			Application.tomorrow = Tomorrow.month+'/'+Tomorrow.date+'/'+Tomorrow.year;
			
			for(var i in Application.Schedules)
			{
				if(Application.Schedules[i].data.date === Application.today)
				{
					Default.schooltoday = Application.Schedules[i].data.unifiedcalendar;
				}
				else if(Application.Schedules[i].data.date === Application.tomorrow)
				{
					Default.schooltomorrow = Application.Schedules[i].data.unifiedcalendar;
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
					$('#'+domId).html(dateType+' '+date).addClass('text-warning');
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
										if(Application.localStorage)
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
			controlUI.style.backgroundColor = '#015289';
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
					if(Application.touch)
					{
						Application.Map.setTouchScroll(false);
					}
					$('#before-map,#div-footer,#grp-directions').hide(750,function(){
						$('#map-width').css('height','100%');
						$('#map-ratio').css('margin-top', $(window).height());
						controlUI.title = 'Click to close up the map.';
						controlText.innerHTML = 'Minimize';
						Application.Map.Map.setCenter(cntr);
						google.maps.event.trigger(Application.Map.Map, 'resize');
					});
					for(var i in Application.Schools)
					{
						google.maps.event.addListener(Application.Schools[i].marker, 'click', Application.Schools[i].toggleInfoBox(Application.Map.Map,Application.Schools[i].marker,Application.Schools[i].infobox));
					}
					for(var i in Application.SafeLocations)
					{
						google.maps.event.addListener(Application.SafeLocations[i].marker, 'click', Application.SafeLocations[i].toggleInfoBox(Application.Map.Map,Application.SafeLocations[i].marker,Application.SafeLocations[i].infobox));
					}
				}
				else
				{
					Application.Map.setPanZoom(false);
					if(Application.touch)
					{
						Application.Map.setTouchScroll(true);
					}
					$('#before-map,#div-footer,#grp-directions').show(750,function(){
						$('#map-width').css('height','');
						$('#map-ratio').css('margin-top','200px');
						controlUI.title = 'Click to interact with the map.';
						controlText.innerHTML = 'Explore Map';
						Application.Map.Map.setCenter(cntr);
						google.maps.event.trigger(Application.Map.Map, 'resize');
						window.scrollTo(0, 1);
					});
					for(var i in Application.Schools)
					{
						google.maps.event.clearListeners(Application.Schools[i].marker, 'click');
					}
					for(var i in Application.SafeLocations)
					{
						google.maps.event.clearListeners(Application.SafeLocations[i].marker, 'click');
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
					console.log(Application.SchoolSelected.data.start.length);
					if(Application.SchoolSelected.data.start.length > 0)
					{
						$('#time-nobtns').hide();
						$('#time.btns').show();
					}
					else
					{
						$('#time-btns').hide();
						$('#time.nobtns').show();
						$('#time,#summary-time').val('12:00 PM');
					}
					var phone = String(Schools[i].data.phone).replace('/[^0-9]/','');
					$('#sick-tel,#sick-tel-summary').text('Call: '+phone.slice(-10,-7)+'-'+phone.slice(-7,-4)+'-'+phone.slice(-4));
					$('#sick').show();
					if(Application.localStorage)
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
			// Date.js doesn't seem to like midnight or noon with an AM/PM attached.
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
			var transitOptions = {};
			console.log(Application.leaverightnow);
			if(Application.leaverightnow === false)
			{
				transitOptions = {
					// subtract 10 minutes so the user has a bit of a real-life buffer.
					arrivalTime : new Date(unixtime - 600000)
				};
			}
			var RouteRequest = {
				origin : $('#mylocation').val()+', ' + Default.city + ', ' + Default.state,
				destination : Application.SchoolSelected.data.address+', '+Default.city+', '+Default.state+' '+Application.SchoolSelected.data.postalcode,
				transitOptions : transitOptions,
				provideRouteAlternatives : true
			};
			if(Application.travelmode === 'TRANSIT')
			{
				RouteRequest.travelMode = google.maps.TravelMode.TRANSIT;
			}
			else if(Application.travelmode === 'WALKING')
			{
				RouteRequest.travelMode = google.maps.TravelMode.WALKING;
			}
			else
			{
				RouteRequest.travelMode = google.maps.TravelMode.DRIVING;
			}
			Application.DirectionsService.route(RouteRequest, function(Response, Status)
				{
					if (Status === google.maps.DirectionsStatus.OK)
					{
						if(Application.leaverightnow === true)
						{
							$('#grp-directions').html('<div class="span12 center"><h4>Leave by <span id=timetoleave></span></h4><p id=clickroutetext><small>Click any suggested route below to see alternate directions.</small><p></div><div id=directions class="span8 offset2"></div>');
						}
						else
						{
							$('#grp-directions').html('<div class="span12 center"><h4>Leave '+$('#summary-date').text()+' by <span id=timetoleave></span></h4><p id=clickroutetext><small>Click any suggested route below to see alternate directions.</small><p></div><div id=directions class="span8 offset2"></div>');
						}
						$('#grp-directions').addClass('padded');
						$('#grp-directions').show();
						Application.DirectionsRenderer.setMap(Application.Map.Map);
						Application.DirectionsRenderer.setPanel(document.getElementById('directions'));
						var leg = 0;
						for(var i=0; i<Response.routes[0].legs.length; i++)
						{
							for(var j=0; j<Response.routes[0].legs[i].steps.length; j++)
							{
								if(Response.routes[0].legs[i].steps[j].travel_mode === Application.travelmode)
								{
									leg = i;
									break;
								}
							}
						}
						for(var i in Application.Schools)
						{
							Application.Schools[i].marker.setMap(null);
						}
						Application.DirectionsRenderer.setDirections(Response);
						if(Application.travelmode === 'TRANSIT')
						{
							$('#timetoleave').html(Response.routes[0].legs[leg].departure_time.text);
						}
						else
						{
								var travelhours = 0;
								var travelminutes = Application.DirectionsRenderer.directions.routes[0].legs[0].duration.text.match(/([0-9]+) min/)[1];
								if(Application.DirectionsRenderer.directions.routes[0].legs[0].duration.text.match(/([0-9]+) h/))
								{
									travelhours = Application.DirectionsRenderer.directions.routes[0].legs[0].duration.text.match(/([0-9]+) h/)[1];
								}
								var milleseconds = ((parseInt(travelhours) * 60) + parseInt(travelminutes)) * 60000;
								// Subtract 10 minutes so no one is late.
								var unixtimeLeaveBy = unixtime - milleseconds - 600000;
								var LeaveByDate = new Date();
								if(Application.leaverightnow === false)
								{
									LeaveByDate = new Date(unixtimeLeaveBy);
								}
								var ampm = 'AM';
								var hour = LeaveByDate.getHours();
								if (hour > 11)
								{
									hour = hour - 12;
									ampm = 'PM';
								}
								else if(hour < 1)
								{
									hour = 12;
								}
								var minute = LeaveByDate.getMinutes();
								if(String(minute).length === 1)
								{
									minute = '0'+minute;
								}
								else if(String(minute).length === 0)
								{
									minute = '00';
								}
								var leaveByDateString = hour+':'+minute+' '+ampm;
								$('#timetoleave').html(leaveByDateString);
						}
						if((Application.travelmode === 'TRANSIT' || Application.travelmode === 'DRIVING') && Application.leaverightnow === true)
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
						google.maps.event.addListener(Application.DirectionsRenderer, 'routeindex_changed', function() {
							if(Application.travelmode === 'TRANSIT')
							{
								$('#timetoleave').html(Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].departure_time.text);
							}
							else
							{
								var travelhours = 0;
								var travelminutes = Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) min/)[1];
								if(Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) h/))
								{
									travelhours = Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) h/)[1];
								}
								var milleseconds = ((parseInt(travelhours) * 60) + parseInt(travelminutes)) * 60000;
								// Subtract 10 minutes so no one is late.
								var unixtimeLeaveBy = unixtime - milleseconds  - 600000;
								var LeaveByDate = new Date();
								if(Application.leaverightnow === false)
								{
									LeaveByDate = new Date(unixtimeLeaveBy);
								}
								var ampm = 'AM';
								var hour = LeaveByDate.getHours();
								if (hour > 11)
								{
									hour = hour - 12;
									ampm = 'PM';
								}
								else if(hour < 1)
								{
									hour = 12;
								}
								var minute = LeaveByDate.getMinutes();
								if(String(minute).length === 1)
								{
									minute = '0'+minute;
								}
								else if(String(minute).length === 0)
								{
									minute = '00';
								}
								var leaveByDateString = hour+':'+minute+' '+ampm;
								$('#timetoleave').html(leaveByDateString);
							}
						});
						google.maps.event.addListener(Application.DirectionsRenderer, 'directions_changed', function() {
								var travelhours = 0;
								var travelminutes = Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) min/)[1];
								if(Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) h/))
								{
									travelhours = Application.DirectionsRenderer.directions.routes[this.routeIndex].legs[0].duration.text.match(/([0-9]+) h/)[1];
								}
								var milleseconds = ((parseInt(travelhours) * 60) + parseInt(travelminutes)) * 60000;
								// Subtract 10 minutes so no one is late.
								var unixtimeLeaveBy = unixtime - milleseconds  - 600000;
								var LeaveByDate = new Date();
								if(Application.leaverightnow === false)
								{
									LeaveByDate = new Date(unixtimeLeaveBy);
								}
								var ampm = 'AM';
								var hour = LeaveByDate.getHours();
								if (hour > 11)
								{
									hour = hour - 12;
									ampm = 'PM';
								}
								else if(hour < 1)
								{
									hour = 12;
								}
								var minute = LeaveByDate.getMinutes();
								if(String(minute).length === 1)
								{
									minute = '0'+minute;
								}
								else if(String(minute).length === 0)
								{
									minute = '00';
								}
								var leaveByDateString = hour+':'+minute+' '+ampm;
								$('#timetoleave').html(leaveByDateString);
								$('#clickroutetext').hide();
						});
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
		var ScheduleFT = new FusionTable(Default.fturl,Default.schoolschedulequery,Default.googlemapsapikey);
		var SchoolFT = new FusionTable(Default.fturl,Default.schoollocationquery,Default.googlemapsapikey);
		var SafeFT = new FusionTable(Default.fturl,Default.safelocationquery,Default.googlemapsapikey);
		if(Application.localStorage)
		{
			$('#school').val($.jStorage.get(Default.storagePrefix+'school',''));
			$('#summary-school').text($.jStorage.get(Default.storagePrefix+'school',''));
			$('#time').val($.jStorage.get(Default.storagePrefix+'time',''));
			Application.leaverightnow  = $.jStorage.get(Default.storagePrefix+'leaverightnow',false);
			$('#summary-time').text($.jStorage.get(Default.storagePrefix+'time',''));
			$('#mylocation').val($.jStorage.get(Default.storagePrefix+'mylocation',''));
			$('#summary-mylocation').text($.jStorage.get(Default.storagePrefix+'mylocation',''));
			storageDate = $.jStorage.get(Default.storagePrefix+'date','');
			storageTravel = $.jStorage.get(Default.storagePrefix+'travel','');
			ScheduleFT.columns = $.jStorage.get(Default.storagePrefix+'scheduleftcolumns',null);
			ScheduleFT.rows = $.jStorage.get(Default.storagePrefix+'scheduleftrows',null);
			SchoolFT.columns = $.jStorage.get(Default.storagePrefix+'schoolftcolumns',null);
			SchoolFT.rows = $.jStorage.get(Default.storagePrefix+'schoolftrows',null);
			SafeFT.columns = $.jStorage.get(Default.storagePrefix+'safeftcolumns',null);
			SafeFT.rows = $.jStorage.get(Default.storagePrefix+'safeftrows',null);
			
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
			
			// Leave right now?
			if(Application.leaverightnow === true)
			{
				$('#summary-datetime').hide();
				$('#summary-leaverightnow').show();
			}
			else
			{
				$('#summary-leaverightnow').hide();
				$('#summary-datetime').show();
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
		if($('#school').val() !== '' && ($('#time').val() !== '' || Application.leaverightnow === true) && storageDate !== '' && $('#mylocation').val() !== '' && storageTravel !== '')
		{
			$('#grp-intro').hide();
			$('#grp-summary').show();
		}
		// Disable next buttons when form fields are empty
		function disable(domid){
			$('#'+domid).addClass('disabled').attr('disabled','disabled');
		}
		if($('#school').val() === '')
		{
			disable('school-next');
		}
		if(storageDate === '' || $('#time').val() === '')
		{
			disable('time-next');
		}
		if(storageTravel === '')
		{
			disable('travel-next');
		}
		if($('#mylocation').val() === '')
		{
			disable('mylocation-next');
		}
		
		// Set up the timepicker - bootstrap-timepicker.js
		$('#time').timepicker(Default.TimepickerOptions);
		
		// Set up the loading message
		$(document).ajaxStart(function() {
			MySpinner.spin(Default.spinnerTarget);
		})
		.ajaxStop(function() {
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
		if(Application.touch)
		{
			Application.Map.setTouchScroll(true);
		}
		var PanZoomControlDiv = document.createElement('div');
		panZoomControl(PanZoomControlDiv);
		PanZoomControlDiv.index = 1;
		Application.Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(PanZoomControlDiv);
		
		if(ScheduleFT.columns === null || ScheduleFT.rows === null)
		{
			$.ajax({
				url: ScheduleFT.url,
				dataType: 'jsonp',
				success: function (ftdata) {
					ScheduleFT.columns = ftdata.columns;
					ScheduleFT.rows = ftdata.rows;
					if(Application.localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'scheduleftcolumns',ScheduleFT.columns);
						$.jStorage.set(Default.storagePrefix+'scheduleftrows',ScheduleFT.rows);
					}
					getSchedule(ScheduleFT.columns,ScheduleFT.rows);
				}
			});
		}
		else
		{
			getSchedule(ScheduleFT.columns,ScheduleFT.rows);
		}
		
		if(SchoolFT.columns === null || SchoolFT.rows === null)
		{
			// Get the School Location FT data!
			$.ajax({
				url: SchoolFT.url,
				dataType: 'jsonp',
				success: function (ftdata) {
					SchoolFT.columns = ftdata.columns;
					SchoolFT.rows = ftdata.rows;
					if(Application.localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'schoolftcolumns',SchoolFT.columns);
						$.jStorage.set(Default.storagePrefix+'schoolftrows',SchoolFT.rows);
					}
					getSchools(SchoolFT.columns,SchoolFT.rows);
				}
			});
		}
		else
		{
			getSchools(SchoolFT.columns,SchoolFT.rows);
		}
		
		if(SafeFT.columns === null || SafeFT.rows === null)
		{
			// Get the School Location FT data!
			$.ajax({
				url: SafeFT.url,
				dataType: 'jsonp',
				success: function (ftdata) {
					SafeFT.columns = ftdata.columns;
					SafeFT.rows = ftdata.rows;
					if(Application.localStorage)
					{
						$.jStorage.set(Default.storagePrefix+'safeftcolumns',SafeFT.columns);
						$.jStorage.set(Default.storagePrefix+'safeftrows',SafeFT.rows);
					}
					getSafe(SafeFT.columns,SafeFT.rows);
				}
			});
		}
		else
		{
			getSafe(SafeFT.columns,SafeFT.rows);
		}
		
		// Is this dev?
		if(typeof ThisIsDev === 'function')
		{
			var Development = new ThisIsDev();
			Development.notice('before-map');
		}
		
		// LISTENERS --------------------------------------------------------------
		
		// find me button click
		$('#mylocation-gps').click(function(){
			mylocationgps();
		});
		
		// school input change
		$('#school').change(function(){
			$('#time-next').addClass('disabled').attr('disabled','disabled');
			$('#time-start-icon,#time-end-icon').html('');
			$('#time-start,#time-end').removeClass('active');
			$('#summary-school').text($('#school').val());
			if(Application.localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'school',$('#school').val());
			}
			Application.SchoolSelected = null;
			for(var i in Application.Schools)
			{
				if(Application.Schools[i].data.longname === $('#school').val())
				{
					Application.SchoolSelected = Application.Schools[i];
					if(Application.SchoolSelected.data.start.length > 0)
					{
						$('#time-nobtns').hide();
						$('#time-btns').show();
					}
					else
					{
						$('#time-btns').hide();
						$('#time-nobtns').show();
					}
					var phone = String(Application.Schools[i].data.phone).replace('/[^0-9]/','');
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
				setSchool(Application.Schools,regex);
			}
			// case sensitive
			if(Application.SchoolSelected === null)
			{
				regex = new RegExp($('#school').val(),'g');
				setSchool(Application.Schools,regex);
			}
			// case insensitive
			if(Application.SchoolSelected === null)
			{
				regex = new RegExp($('#school').val(),'gi');
				setSchool(Application.Schools,regex);
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
		
		// Leave right now
		$('#leaverightnow').click(function(){
			Application.leaverightnow = true;
			if(Application.localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'leaverightnow',true);
			}
			$('#summary-datetime').hide();
			$('#summary-leaverightnow').show();
			$('#grp-time').hide();
			$('#grp-travel').show();
			window.scrollTo(0, 1);
		});
		
		// date-time screen function
		function dateTimeNext() {
			if($('#summary-date').text().length > 0 && $('#time').val() !== '')
			{
				$('#time-next').removeClass('disabled').removeAttr('disabled');
			}
		}
		
		// Today Button Listener
		$('button.date').on('click', function() {
			if(Application.localStorage)
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
				if(Application.localStorage)
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
				if(Application.localStorage)
				{
					$.jStorage.set(Default.storagePrefix+'time', timestring);
				}
			}
			dateTimeNext();
		});
		
		// time change
		$('#time').timepicker().on('hide.timepicker', function() {
			if(Application.localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'time', $('#time').val());
			}
			$('#summary-time').text($('#time').val());
			$('#time-start-icon,#time-end-icon').text('');
			$('#time-start,#time-end').removeClass('active');
			dateTimeNext();
		});
		
		// travel change
		$('button.travel').on('click', function() {
			Application.travelmode = $(this).val();
			if(Application.localStorage)
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
			if(Application.localStorage)
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
		$('#time-next').click(function(){
			Application.leaverightnow = false;
			if(Application.localStorage)
			{
				$.jStorage.set(Default.storagePrefix+'leaverightnow',false);
			}
			$('#summary-datetime').show();
			$('#summary-leaverightnow').hide();
			$('#grp-time').hide();
			$('#grp-travel').show();
			window.scrollTo(0, 1);
		});
		
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
				$('#grp-directions').removeClass('center padded');
				if(Application.traffic !== null)
				{
					Application.traffic.setMap(null);
				}
				if(Application.DirectionsRenderer !== null)
				{
					Application.DirectionsRenderer.setMap(null);
				}
				for(var i in Application.Schools)
				{
					Application.Schools[i].marker.setMap(Application.Map.Map);
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
			_gaq.push(['_trackEvent', 'Route', 'Click', Application.SchoolSelected.data.longname]);
			route();
		});

	});

})();