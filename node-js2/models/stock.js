
module.exports = function(sequelize, DataTypes) {
    var stock = sequelize.define('stock', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        symbol: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    return stock;
};