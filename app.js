var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');

const routers = {
	index: require('./routes/index'),
	node: require('./routes/node'),
	user: require('./routes/user'),
	relation: require('./routes/relation'),
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({
	preflightContinue: false,
	origin: true,
	credentials: true,
}));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routers.index);
app.use('/node', routers.node);
app.use('/user', routers.user);
app.use('/relation', routers.relation);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = process.env.da3002env === 'dev' ? err : {};

	console.log(err.message);

	// render the error page
	res.status(err.status || 500);
	res.json({
		error: err
	});
});

module.exports = app;
