var assert = require('chai').assert;

var Greenhouse = require('../greenhouseio.js');
var AUTH = require('../keys.company.json');


var gh = Greenhouse(AUTH.COMPANY, AUTH.API_KEY);

gh.request('offices')

gh.request('candidates')

// gh.get('offices');

// gh.get('office', 81);

// gh.post('application', requestBody);

