var bcrypt = require('bcryptjs');
var cryptojs = require('crypto-js');
module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        facebook_email: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        facebook_id: {
            type: DataTypes.STRING
        },
        facebook_token: {
            type: DataTypes.STRING
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password:{
            type: DataTypes.VIRTUAL,
            validate: {
                len: [7,100]
            },
            set: function(value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value,salt);
                
                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        save_amount: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        how_long: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        hooks: {
            beforeValidate: function(user, options) {
                if(typeof user.email === 'string') {
                    user.email = user.email.toLowerCase();
                }
            }
        }, 
        classMethods: {
            authenticate: function(email, password) {
                return new Promise(function(resolve, reject) {
                    if(typeof email !== 'string' || typeof password !== 'string')
                        return reject();
                    user.findOne({
                        where: {
                            email: email
                        }
                    }).then(function(user) {
                        if(!user || !bcrypt.compareSync(password, user.get('password_hash')))
                            return reject();
                        resolve(user);
                        
                    }, function(e){
                        reject();
                    });
                });
            }
        }
    });
    return user;
};