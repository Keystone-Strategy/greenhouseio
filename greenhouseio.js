var request = require('request-promise');

var API_ROOT = 'https://api.greenhouse.io/v1/boards/';
var HARVEST_API_ROOT = 'https://harvest.greenhouse.io/v1/'

function GreenhouseRequest(company_name, api_key) {

  // used for validation, required url params
  var GH_ENDPOINTS = {
    offices:      null,
    office:       ['id'], // ?id={{officeId}}
    departments:  null,
    department:   ['id'], // ?id={{departmentId}}
    jobs:         null,
    job:          ['id'], // ?id={{jobId}}&questions=true
    // applications: ['postBody'] // a parsed/converted post body via .post()
  }

  var HARVEST_ENDPOINTS = {
    candidates: null,
    applications: null,
    job_stages: null
  }

  var ENDPOINTS = {
    'GH': {'OBJECTS':GH_ENDPOINTS, 'URI': API_ROOT, 'AUTH':false},
    'HARVEST':{'OBJECTS':HARVEST_ENDPOINTS, 'URI': HARVEST_API_ROOT, 'AUTH':true}
  }

  // for job applications, use basic auth, username == API KEY, blank pass
  // we're doing this here because require-promise hid the interface for auth...
  GH_APPLICATIONS = 'https://' + api_key + ':@api.greenhouse.io/v1/applications/';

  var api_uri = API_ROOT + company_name + '/embed/';
  var module = {};

  function _validateEndpoint(endpoint, params) {

    if(!(endpoint in GH_ENDPOINTS) && !(endpoint in HARVEST_ENDPOINTS) ) {
      throw new Error("'" + endpoint + "' is not supported by Greenhouse");
    }

    if((endpoint in GH_ENDPOINTS) && (endpoint in ['office', 'job', 'department']) && !params.hasOwnProperty('id')) {
      throw new Error("'" + endpoint + "' requires id parameter to be set");
    }

    if((endpoint in GH_ENDPOINTS) && (endpoint === 'applications') && !params.postBody) {
      throw new Error("'/applications' requires a form post body");
    }

  }
  function _getApiUri(endpoint){
    for (EP in ENDPOINTS){
      if (Object.keys(ENDPOINTS[EP]['OBJECTS']).indexOf(endpoint) >= 0) {
        return EP;
      }
    }
  }

  function _getOptions(endpoint){
    var EP = _getApiUri(endpoint);

    var options = {
      uri: ENDPOINTS[EP]['URI'] + endpoint,
    };

    if (ENDPOINTS[EP]['AUTH']){
      options['auth'] = {
        user: api_key,
        password: ''
      }
    }

    return options;

  }
  function _ghRequest(endpoint, params, postBody, cb) {

    _validateEndpoint(endpoint, params);

    // we want promises from top to bottom, request-promise has a weird interface.
    // might we worth dropping request-promise in favor of this native wrapper...
    return new Promise(function(fulfill, reject) {


      var options = _getOptions(endpoint)

      console.log(options);


      if(endpoint === 'applications' && params) {

        // options.auth = {
        //   'user': AUTH.api_key,
        //   'pass': '',
        //   'sendImmediately': false
        // };

        options.method = 'POST';
        options.formData = params.postBody; // add form post data via params

      } else if (params) {
        // tack on ?id={{someId}} for items with an ID provided via params
        // TODO: make this less hacky, more configurable - pk
        options.uri += '?id=' + params;

        // one-off for special jobs param so we can build question forms
        // TODO: again, more config, less hack - pk
        if(endpoint === 'job') {
          options.uri += '&questions=true'
        }
      }


      // make the actual API request
      request(options).then(function(response) {
          /* TMP hack for false 200 response from GH */
          if (response.substr(0, 1) === "<") {
            // if we get HTML back from API, it's a bad response - pk
            throw new Error("Bad Response From Server");
          }
          fulfill(response);
        }).catch(function(err) {
          reject(err);
        });

    });

  }

  module.request = function(endpoint, urlParams) {
    return _ghRequest(endpoint, urlParams);
  };

  return module;
}

module.exports = exports = GreenhouseRequest;
