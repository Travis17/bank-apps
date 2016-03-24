module.exports = function(stocks, callback) {
    var request = require('request');
    if(!stocks) {
        return;
    }
    
    var stockprice = require('./stock-price.js');
        
    var stocks_list = [];
    
    for(var key in stocks) {
        stockprice(stocks[key].dataValues.symbol, stocks[key].dataValues.id, function(json){
            if(!json) {
                console.log('No stock information');
                return;
            } else if(json !== 'myFunction([])') {
                
                stock = {name: json.Name, symbol: json.Symbol, price: json.LastPrice, id: json.id};
                
                if(stocks_list.push(stock) === stocks.length) {
                    
                    return callback(stocks_list);
                }
            } else {
                
                return;
            }
            
        });
         
    }
    
    
}

