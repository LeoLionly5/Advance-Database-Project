require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Router = require('./routes/api/apis');

const connectDB = require('./middlewares/db');
connectDB.connect();

const PGDBpool = require('./middlewares/pgsqlDB');
const app = express();

var allowCrossDomain = function (req, res, next){
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};
app.use(allowCrossDomain);

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(express.static(__dirname + '/node_modules/jquery/dist'));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use(express.static(__dirname + '/node_modules/bootstrap-table/dist'));
app.use(express.static(__dirname + '/node_modules/handlebars/dist'));
app.use(express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free'));

// login part
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:false}));

// // session
app.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized: false,
    cookie : {
      maxAge : 1000 * 60 * 3,
    },
  }));

// // login check
app.post('/pgapi/logincheck',function(req,res,next){
    console.log(req.body);
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT * FROM public."User" WHERE username = $1 AND password = $2 ',[req.body.username, req.body.password], function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                console.log(data.rows);
                if(data.rowCount==0){
                    console.log("Wrong Username or Password!");
                    res.status(202).json({userid:null, username:null, password:null, roleid:null});
                }
                else{
                    console.log("Hello, " + req.body.username + ", welcome!");
                    var user = {
                        userid: data.rows[0].userid,
                        username: req.body.username,
                        password: null,
                        roleid: data.rows[0].roleid
                    };
                    req.session.user = user;
                    res.status(201).json({userid:data.rows[0].userid, username:req.body.username, password:null, roleid:data.rows[0].roleid});
                }
            }
        });
        client.release();
    });
})

// // api gateway
app.use(function(req,res,next){

    var enable = 1;

    if(enable==1){
    //if(process.env.APIGATEWAY==1){
        console.log(req.url)
        if(req.url=='/pgapi/logincheck'){
            next();
        }
        else{
            if(!req.session.user){
                return next(new Error("Sorry, you have not logged in"))
            }
            if(req.url.substring(0,8)=="/pgadmin" && req.session.user.roleid!=3){
                return next(new Error("Sorry, you have no rights for that api"))
            }
            else{
                var user = req.session.user;
                var username = user.username;
                console.log("Hello, "+username+", you can use this api");
            }
            next();
        }
    }
    else{
        next();
    }
})

// routers
app.use('/', Router);
//

app.get('/', function(req, res) {
    res.send('It works !');
});

app.use((req, res, next) => {
    const error = new Error('Not Found !');
    error.status = 404;
    next(error);
});

app.listen(process.env.PORT, function() {
    console.log('Server running on localhost:' + process.env.PORT);
});