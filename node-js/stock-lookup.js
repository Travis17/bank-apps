module.exports = function(stock, callback) {
    var request = require('request');
    if(!stock) {
        return callback();
    }
    var url = 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup/jsonp?input=' + encodeURIComponent(stock) + '&callback=myFunction';

    request({
        url: url, 
        json: true
    }, function (error, response, body){
        if(error) {
            callback();
        } else {
            callback(body);
        }
    });
}

