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
	console.log ( data) ;
	var location = (_.isUndefined(data))?{lat: 22.2799907,lng: 114.1587983}:_.first(data.results).geometry.location ;
	var initial = {lat:location.lat, lon: location.lng} ;
	var viewport = (_.isUndefined(data))?{northeast: {lat: 22.289858,lng: 114.1942549},southwest: {lat: 22.2785533,lng: 114.1838907}}:_.first(data.results).geometry.viewport ;

	if ( !_.isUndefined(data)) {
		console.log ( "%s %s", moment().format(), _.first(data.results).formatted_address ) ;		
	}
	
	

	_.each ( _.range(2), function(value) {
		var stop = (value === 1)  ;


		var step = 300 ;
		var wpt = _.chain(_.range(step)).map(function(val) {
			
			var center = geolib.getCenter([
					this.viewport.northeast,
					this.viewport.southwest
				]) ;

			var maxDist = _.max(
				[ geolib.getDistance(this.viewport.southwest, center), 300]
			) ;

			var maxDist = geolib.convertUnit('km', maxDist, 2) ;
			// console.log ( maxDist) ;
			// var dist = _.random(10, maxDist) ;
			var dist = (this.stop)?_.random(0, 50):_.random(10, 500) ;

			var angle = _.chain(_.range(12)).map(function(val){ return val * 30}).value() ;
			

			var bearing = (this.stop)?angle[(val % angle.length)]:_.random(0, 360) ;
			var bearing = _.random(0, 360) ;

			

			var result = geolib.computeDestinationPoint(this.initial, dist, bearing);
			// this.initial = result ;
			return {
				"@": {
					lat: result.latitude ,
					lon: result.longitude
				},
				"time":moment().add(val, 'm').format("YYYY-MM-DDTHH:mm:ss")
			}

		}, {config: config, initial: initial, stop: stop, viewport: viewport}).value() ;

		var data = {
			"@": {
				"xmlns": "http://www.topografix.com/GPX/1/1",
				"version": "1.1",
				"creator": "walker"
			},
			"wpt": wpt
		};

		var gpxFile = fs.createWriteStream(((stop)?"gpx.stop.gpx":"gpx.walker.gpx")) ;
		gpxFile.write(js2xmlparser("gpx", data)) ;
		console.log ( '%s %s' , moment().format(),((stop)?"gpx.stop.gpx":"gpx.walker.gpx")) ;
		
	}) ;
	console.log ( '%s Generate GPX complete %s', moment().format(), process.argv[2]) ;
	

}) ;