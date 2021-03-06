var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require( './routes/index' );
var apiCall = require( './routes/api' );
var mobile = require( './routes/mobile' );


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'pier checkout sdk',
  resave: true,
  key: 'pierPayId',
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge:1000*60*60 }
}))

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/pierlogo38.png'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  var auth_order = req.session.auth_order;
  if( !auth_order ){
    auth_order = req.session.auth_order = {};
  }else{

  }
  next();
})

app.use('/', routes);
app.use('/mobile', mobile);
app.use( '/api/v1/users', apiCall );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render( 'checkout/unknownError',{ error: body.message, title: '订单错误', location: 'error'} );
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render( 'checkout/unknownError',{ error: body.message, title: '订单错误', location: 'error'} );
  });
});


module.exports = app;
