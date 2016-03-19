//Travis Knoll
//ASL

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

//Variable app created to use, get and set user information.
var app = express();

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

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.user.findById(id).then(function(user) {
        done(null, user);
    });
});

//login page
app.get('/login', function(req, res) {
    if(req.isAuthenticated())
        res.redirect('/dashboard');
    else
        res.render('login',  { message: req.flash('loginMessage') });
});
//signup page
app.get('/signup', function(req, res){
    if(req.isAuthenticated())
        res.redirect('/dashboard');
    else
        res.render('signup', { message: req.flash('signupMessage') });
});

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
app.get('/', function(req, res) {
    if(req.isAuthenticated())
        res.redirect('/dashboard');
    else
        res.render('index');
});

app.get('/dashboard', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('dashboard', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    }
    else
        res.redirect('/login');
});
//port for localhost:3000
var PORT = process.env.PORT || 3000;



db.sequelize.sync().then(function(){
    app.listen(PORT, function() {
        console.log('http://localhost:' + PORT + '/');
    });
});


