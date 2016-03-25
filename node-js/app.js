//Travis Knoll
//ASL
//Node Bank-app


//Middleware and sessions requires within modules
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var flash = require('connect-flash');

//Database connection
var db = require('./db.js');

//Authentication of users with the passpost module
var passport = require('passport');
var passportLocal = require('passport-local');
var LocalStrategy = require('passport-local').Strategy;
//Facebook variable created
var FacebookStrategy = require('passport-facebook').Strategy;

//Variable app created to use, get and set user information.
var app = express();

//static file placement
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'secret that you need',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use('local-login', new LocalStrategy({passReqToCallback: true}, function(req, username, password, done) { 
    db.user.authenticate(username, password).then(function(user){
        if(!user) {
            req.flash('loginMessage', 'User not found. Please try again. ');
            return done(null, false);
        }       
        return done(null, user);
    }).catch(function(e) {
        req.flash('loginMessage', 'Invalid username or password. Please try again.');
        return done(null, false);
    });
}));
//Facebook
passport.use(new FacebookStrategy({
    clientID: '794457717352753',
    clientSecret: '35c834e264041ac2a0e4c817fef333b2',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name']
}, function(token, refreshToken, profile, done){
    process.nextTick(function(){
        
        db.user.findOne({where:{'facebook_id': profile.id}}). then(function(user){
            if(user) {
                return done(null,user);
            } else {
                email = profile.emails[0].value;
                facebook_id = profile.id;
                facebook_token = token;
                name = profile.name.givenName + ' ' + profile.name.familyName;
                db.user.create({facebook_email: email, facebook_id: facebook_id, facebook_token: facebook_token, name: name}).then(function(user){
                    return done(null, user);
                }).catch(function(e) {
                    return done(e);
                });
            }
        }).catch(function(e){
            done(e);
        });
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.user.findById(id).then(function(user) {
        done(null, user);
    });
});

app.get('/', function(req, res) {
    if(req.isAuthenticated()) {
        req.session.stocks = null;
        res.redirect('/dashboard');
    } else {
        res.render('index');
    }
});
//login
app.get('/login', function(req, res) {
    if(req.isAuthenticated()) {
        req.session.stocks = null;
        res.redirect('/dashboard');
    } else {
        res.render('login',  { message: req.flash('loginMessage') });
    }
});



//signup
app.get('/signup', function(req, res){
    if(req.isAuthenticated()) {
        req.session.stocks = null;
        res.redirect('/dashboard');
    } else {
        res.render('signup', { message: req.flash('signupMessage') });
    }
});

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/dashboard',
    failureRedirect: '/'
}));

app.post('/signup', function(req, res){
    email = req.body.username;
    password = req.body.password;
    name = req.body.name;
    db.user.create({email: email, password: password, name: name}).then(function(user){
        if(user) {
            res.redirect('/login');
        }
    }).catch(function(e) {
        req.flash('signupMessage', e.errors[0].message);
        res.redirect('/signup');
    });
    
});
app.get('/contact', function(req, res) {
    req.logout();
    res.redirect('/');
});

//logout
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/login',
        faliureFlash: true
    })
); 
//dashboard
app.get('/dashboard', function(req, res) {
    if(req.isAuthenticated()) {
        /* user_stocks = db.stock.findAll({where: {userId: req.user.id}});
        req.session.stocks = null;
        res.render('dashboard', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user,
            user_stocks: user_stocks
        });
        */
        db.stock.findAll({where: {userId: req.user.id}}).then(function(stocks) {
            if(!stocks || !stocks.length) {
                res.render('dashboard', {
                    isAuthenticated: req.isAuthenticated(),
                    user: req.user,
                    user_stocks: []
                });
            } else {
                var stocklist = require('./stock-list.js');
                stocklist(stocks, function(list) {
                    
                    res.render('dashboard', {
                        isAuthenticated: req.isAuthenticated(),
                        user: req.user,
                        user_stocks: list
                    });
                });
            }
        }).catch(function(e){
            console.log('error');
        });
    } else {
        res.redirect('/');
    }
});
//profile
app.get('/profile', function(req, res){
    if(!req.isAuthenticated()) {
        req.session.stocks = null;
        res.redirect('/');
    } else {
        res.render('profile', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    }
});

app.post('/profile', function(req, res){
    if(req.isAuthenticated()) {
        email = req.body.username;
        name = req.body.name;
        how_long = req.body.how_long;
        save_amount = req.body.save_amount;
        date = req.body.date;
        db.user.update({email: email, name: name, how_long: how_long, save_amount: save_amount, date: date}, {where:{id: req.user.id}}).then(function(user) {
            if(user) {
                res.redirect('/dashboard');
            }
        });
        
    } else {
        res.redirect('/');
    }    
});
//stocks
app.get('/stocks', function(req,res) {
    
    if(req.isAuthenticated()) {
        db.stock.findAll({where: {userId: req.user.id}}).then(function(stocks) { 
            if(!stocks || !stocks.length) {
                res.render('stocks', {
                    message: req.flash('stockmessage'),
                    stocks: req.session.stocks,
                    user_stocks: []
                });
            } else {
                var stocklist = require('./stock-list.js');
                stocklist(stocks, function(list) {
                    res.render('stocks', {
                        message: req.flash('stockmessage'),
                        stocks: req.session.stocks,
                        user_stocks: list
                    });
                });
            }
        });
        
    } else {
        res.redirect('/');
    }
});

app.post('/stocks', function(req,res) {
    if(req.isAuthenticated()) {
        stock = req.body.name;
        req.session.stocks = null;
        var startPos = stock.indexOf('stock-symbol:');
        var endPos = stock.indexOf(',stock-name:');
        
        if(startPos !== -1 && endPos !== -1) {
            var stockSymbol = stock.substring(startPos+13, endPos);
            var stockName = stock.substring(endPos+12);
            db.stock.create({name: stockName, symbol: stockSymbol}).then(function(stock) {
                if(stock) {
                    req.user.addStock(stock).then(function(stock){
                        req.flash('stockmessage', 'Stock added successfully');
                        res.redirect('/stocks');
                    });

                }
            }).catch(function(e) {
                res.redirect('/stocks');
            });
        } else {
            var stocklookup = require('./stock-lookup.js');
            
            stocklookup(stock, function(stocks){
                if(!stocks) {
                    console.log('No stock information');
                    return;
                }
                if(stocks !== 'myFunction([])') {
                    var startPos = stocks.indexOf('([{');
                    var endPos = stocks.indexOf('}])');
                    var jsonString = stocks.substring(startPos+1, endPos+2);
                    json = JSON.parse(jsonString);
                } else {
                    json = [];
                }
                if(!json.length) {
                    res.redirect('/stocks');
                } else if(json.length === 1) {
                    db.stock.create({name: json[0].Name, symbol: json[0].Symbol}).then(function(stock) {
                        if(stock) {
                            req.user.addStock(stock).then(function(stock){
                                req.flash('stockmessage', 'Stock added successfully');
                                res.redirect('/stocks');
                            });

                        }
                    }).catch(function(e) {
                        res.redirect('/stocks');
                    });
                } else {
                    stocks = req.session.stocks = [];
                    json.forEach(function(stock) {
                        stocks.push({name:stock.Name, symbol:stock.Symbol});
                    });
                    req.session.stocks = stocks;
                    res.redirect('/stocks');
                }
            });
        }
    } else {
        res.redirect('/');
    }
});

app.get('/stocks/:id/delete', function(req, res) {
    id = req.params.id;
    if(req.isAuthenticated()) {
        db.stock.findById(id, {include:{model:db.user}}).then(function(stock) {
            if(stock.userId === req.user.id) {
                stock.destroy().then(function(affectedRows) {
                    if(affectedRows) {
                        req.flash('stockMessage', 'Stock deleted.');
                    }
                    res.redirect('/stocks');
                }).catch(function(e){
                    req.flash('stockMessage', e.errors[0].message);
                    res.redirect('/stocks');
                });
            }
        });
    } else {
        res.redirect('/');
    }
});

var PORT = process.env.PORT || 3000;

db.sequelize.sync().then(function(){
    app.listen(PORT, function() {
        console.log('http://localhost:' + PORT + '/');
    });
});


