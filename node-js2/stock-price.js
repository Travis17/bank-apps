module.exports = function(stock, id, callback) {
    var request = require('request');
    if(!stock) {
        return;
    }
    var url = 'http://dev.markitondemand.com/MODApis/Api/v2/Quote/jsonp?symbol=' + encodeURIComponent(stock) + '&callback=myFunction';

    request({
        url: url, 
        json: true
    }, function (error, response, body){
        if(error) {
            return;
        } else {
            var startPos = body.indexOf('({');
            var endPos = body.indexOf('})');
            var jsonString = body.substring(startPos+1, endPos+1);
            json = JSON.parse(jsonString);
            json.id = id;
            return callback(json);
        }
    });
}

