var request = require('request');
var moment = require('moment');
var math = require('mathjs');


var apiEndpoint = "https://api.xively.com/v2/"
var feed_id = 59871;
var stream_id = 1; // active-clients



var options = {
	json: true,
	headers: {
		"X-ApiKey": "2Cvmde1JdNhls4DzACa2dwDNwqpFS2STV2Eg5eV8sZ6DSz4b",
		"Content-Type": "application/json"
	}
};

var m1 = moment().startOf("month").subtract(2, 'month');
var m2 = moment().startOf("month").subtract(1, 'month');

values = []
values[m1.month()] = []
values[m2.month()] = []

request.get(apiEndpoint + "/feeds/" + feed_id + '/datastreams/' + stream_id + '.json?duration=90days&interval=86400', options, function(error, response, body) {
	if (!error) {
		body.datapoints.forEach(function(datapoint) {
			var m = moment(datapoint.at);
			if (typeof values[m.month()] === 'undefined') return;
			values[m.month()].push(parseInt(datapoint.value))
		});

		console.log('\n---------------')
		console.log('Mosquitto stats')
		console.log('--------------- \n')

		console.log(m1.format(' - MMMM:\t'), math.median(values[m1.month()]))
		console.log(m2.format(' - MMMM:\t'), math.median(values[m2.month()]))
	}
});


// parse californium log

var Lazy = require('lazy'),
	fs = require("fs");

var ipRegex = /(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|0){1,}(?:\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}/
var dateRegex = /(201[0-9]-[0-2][0-9]-[0-3][0-9])/

var logFiles = ['./cf.log', 'lwm2m.log'];

// var lazyList = lazy.readFile(logFile)
// 	.lines()
// 	.map(function(line) {
// 		var ip = line.match(ipRegex)
// 		return ip ? ip[0] : null;
// 	}).filter(function(e) {
// 		return e != null;
// 	}).uniq().each(console.log);


logFiles.forEach(function(logFile) {
	var result = {};

	var lz = new Lazy;

	new Lazy(fs.createReadStream(logFile))
		.lines
		.map(String)
		.map(function(line) {
			var ip = line.match(ipRegex)
			var date = line.match(dateRegex)

			if (ip == null || date == null) {
				return null;
			}

			return {
				ip: ip[0],
				date: moment(date, 'YYYY-MM-DD')
			}
		}).filter(function(e) {
			return e != null;
		}).forEach(function(e) {
			var m = e.date.format('YYYY MMMM')

			if (typeof result[m] === 'undefined') {
				result[m] = {}
			}

			if (typeof result[m][e.ip] === 'undefined') {
				result[m][e.ip] = 0
			}

			result[m][e.ip] ++;
		}).join(function() {

			console.log('\n---------------')
			console.log(logFile)
			console.log('--------------- \n')


			for (key in result) {
				console.log(' - ' + key + ':\t', Object.keys(result[key]).length)
			}
		});

});