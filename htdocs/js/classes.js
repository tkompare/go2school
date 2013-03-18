/**
 * Date formatting
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
 * Google Fusion Table connector and data
 */
var FusionTable = (function(){
	var constructor = function(url,query,googlemapsapikey)
	{
		this.columns = null;
		this.rows = null;
		this.url = url+'?sql='+encodeURIComponent(query)+'&key='+googlemapsapikey+'&callback=?';
	};
	return constructor;
})();

/**
 * Properties within the GoToSchool application
 */
var GoToSchool = (function(){
	var constructor = function() {
		// Google Directions Renderer
		this.DirectionsRenderer = null;
		// Google Directions Service
		this.DirectionsService = null;
		// Oh dear lord, browser detection. -10 Charisma. Is the browser android or iPhone?
		this.isPhone = (navigator.userAgent.match(/iPhone/i) || (navigator.userAgent.toLowerCase().indexOf("android") > -1)) ? true : false;
		// Leave right now
		this.leaverightnow = false;
		// Is local browser storage available?
		this.localStorage = $.jStorage.storageAvailable();
		// The tkmap object
		this.Map = null;
		// The user's location information
		this.MyLocation = {
			lat:null,
			lng:null,
			LatLng:null,
			address:null
		};
		// Holds the array of safe locations
		this.SafeLocations = [];
		// Holds the array of schedule (date) information
		this.Schedules = [];
		// List of school names for the typeahead drop-down
		this.schoolnames = [];
		// Array of Schools
		this.Schools = [];
		// The school currently selected
		this.SchoolSelected = null;
		// Today's Date mm/dd/yyyy
		this.today = null;
		// Tomorrow's Date mm/dd/yyyy
		this.tomorrow = null;
		// Is this a touch device? USES Modernizr.js
		this.touch = Modernizr.touch;
		// Google Maps API Traffic Layer
		this.traffic = null;
		// travel mode
		this.travelmode = null;
	};
	return constructor;
})();

/**
 * Map Location class
 */
var MapLocation = (function(){
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
 * Schedule information for each day
 */
var Schedule = (function(){
	var constructor = function() {
		this.data = [];
	};
	return constructor;
})();

/**
 * School class
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