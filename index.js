var _ = require('underscore') ;
var config = require('config') ;
var moment = require('moment') ;
var geolib = require('geolib') ;
var request = require('request') ;
var js2xmlparser = require("js2xmlparser");
var fs = require('fs') ;


var url = "https://maps.googleapis.com/maps/api/geocode/json?&address=" + encodeURIComponent(process.argv[2]) ;
console.log ( process.argv) ;
console.log ( "%s %s", moment().format(), url) ;



request.get({url: url, json: true}, function(e, r, data) {
	
	var location = _.first(data.results).geometry.location ;
	var initial = {lat:location.lat, lon: location.lng} ;
	console.log ( "%s %s", moment().format(), _.first(data.results).formatted_address ) ;
	

	_.each ( _.range(2), function(value) {
		var stop = (value === 1)  ;

		var step = 300 ;
		var wpt = _.chain(_.range(step)).map(function(val) {
			
			var dist = 150 ;
			var angle = _.chain(_.range(12)).map(function(val){ return val * 30}).value() ;
			

			// console.log ( (val % angle.length)) ;
			var bearing = (this.stop)?angle[(val % angle.length)]:_.sample(angle) ;
			// console.log ( bearing) ;
			

			var result = geolib.computeDestinationPoint(this.initial, dist, bearing);
			this.initial = result ;
			return {
				"@": {
					lat: result.latitude ,
					lon: result.longitude
				},
				"time":moment().add(val, 'm').format("YYYY-MM-DDTHH:mm:ss")
			}

		}, {config: config, initial: initial, stop: stop}).value() ;

		var data = {
			"@": {
				"xmlns": "http://www.topografix.com/GPX/1/1",
				"version": "1.1",
				"creator": "walker"
			},
			"wpt": wpt
		};

		// console.log(js2xmlparser("gpx", data));

		var gpxFile = fs.createWriteStream(((stop)?"gpx.stop.gpx":"gpx.walker.gpx")) ;
		gpxFile.write(js2xmlparser("gpx", data)) ;
		console.log ( '%s %s' , moment().format(),((stop)?"gpx.stop.gpx":"gpx.walker.gpx")) ;
		
	}) ;
	console.log ( '%s Generate GPX complete %s', moment().format(), process.argv[2]) ;
	

}) ;