var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if(env === 'development') {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-node-js.sqlite'
    });
}

var db = {};

db.user = sequelize.import(__dirname + '/models/user.js');
db.stock = sequelize.import(__dirname + '/models/stock.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.stock.belongsTo(db.user);
db.user.hasMany(db.stock);

module.exports = db;




