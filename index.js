var _ = require('underscore') ;
var config = require('config') ;
var moment = require('moment') ;
var geolib = require('geolib') ;
var request = require('request') ;
var js2xmlparser = require("js2xmlparser");
var fs = require('fs') ;


var url = "https://maps.googleapis.com/maps/api/geocode/json?&address=" + encodeURIComponent(process.argv[2]) ;
console.log ( "%s %s", moment().format(), url) ;


request.get({url: url, json: true}, function(e, r, data) {
	
	var location = _.first(data.results).geometry.location ;
	var initial = {lat:location.lat, lon: location.lng} ;
	console.log ( "%s %s", moment().format(), _.first(data.results).formatted_address ) ;

	var wpt = _.chain(_.range(100)).map(function(val) {
		
		var dist = 200;
		var angle = _.chain(_.range(12)).map(function(val){ return val * 30}).value() ;
		
		var bearing = _.sample (angle)
		

		var result = geolib.computeDestinationPoint(this.initial, dist, bearing);
		this.initial = result ;
		// console.log ("%s %s %s", moment().format(), result.latitude, result.longitude ) ;
		return {
			"@": {
				lat: result.latitude ,
				lon: result.longitude
			},
			"time": moment().add(val, 'm').format("YYYY-MM-DDTHH:mm:ss")
		}

	}, {config: config, initial: initial}).value() ;

	var data = {
		"@": {
			"xmlns": "http://www.topografix.com/GPX/1/1",
			"version": "1.1",
			"creator": "walker"
		},
		"wpt": wpt
	};

	// console.log(js2xmlparser("gpx", data));

	var gpxFile = fs.createWriteStream("GPXWalker.gpx") ;
	gpxFile.write(js2xmlparser("gpx", data)) ;
	console.log ( '%s Generate GPX complete %s', moment().format(), process.argv[2]) ;

}) ;