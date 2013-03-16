// Default settings for this application
var Default = {
	// City name passed to Google for geolocation
	city:'Chicago',
	// Check icon when user clicks on a choice button
	check:'<i class="icon-ok icon-white"></i> ',
	// Google DirectionsRenderer options
	DirectionsOptions:{
		draggable:true,
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
	// Google maps API key
	googlemapsapikey:'AIzaSyDH5WuL3gKYVBWVqLr6g3PQffdZE-XhBUw',
	// infobox.js options
	infoboxoptions:{
		disableAutoPan: false,
		maxWidth: 0,
		pixelOffset: new google.maps.Size(-140, 0),
		zIndex: null,
		boxStyle: {
			background: "url('img/tipbox.gif') no-repeat",
			opacity: 0.92,
			width: "160px"
		},
		closeBoxMargin: "11px 4px 4px 4px",
		closeBoxURL: "img/close.gif",
		infoBoxClearance: new google.maps.Size(20, 30),
		visible: false,
		pane: "floatPane",
		enableEventPropagation: false
	},
	// Start center latutude of the Google map
	lat:41.85,
	// Start center longitude of the Google map
	lng:-87.675,
	// Default message for today
	schooltoday:'No Schedule Available',
	// Default message for tomorrow
	schooltomorrow:'No Schedule Available',
	// Google Fusion Tables SQL-like query string for school schedule data
	schoolschedulequery:'SELECT date, dayofweek, unifiedcalendar FROM 1u765vIMSPecSEinBe1H6JPYSFE5ljbAW1Mq3okc',
	// Google Fusion Tables SQL-like query string for school location data
	schoollocationquery:'SELECT lat, lng, longname, address, postalcode, phone, start, end FROM 1qCOcgrhGwjt6bdx_UVPSkyIMMVD-1C7CJFvpIjI',
	// Google Fusion Tables SQL-like query string for safe location data
	safelocationquery:'SELECT lat, lng, name, address, postalcode, phone, type FROM 1I-edYtBu3Dvx_Ng08Gw_GVrPfwa187KGUegsZUc',
	// spin.js Spinner Options
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
	},
	// DOM ID target for the spin.js spinner
	spinnerTarget:document.getElementById('before-map'),
	// State/Province name passed to Google for geolocation
	state:'IL',
	// Local Storage prefix
	storagePrefix:'go2school.smartchicagoapps.org-',
	// Defined style types passed to TkMap
	styles:'grey minlabels',
	// bootstrap-timepicker.js options
	TimepickerOptions:{
		minuteStep:5,
		showInputs:false,
		disableFocus:true,
		template:'modal',
		modalBackdrop:true
	},
	// Initial zoom level for the Google map
	zoom:14
};