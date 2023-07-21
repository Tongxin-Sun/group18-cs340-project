/*
    SETUP
*/

// Express
var express = require('express');
var app = express();
PORT = 8018;

// Database
var db = require('./database/db-connector')

const { engine } = require('express-handlebars');
var exphbs = require('express-handlebars');     // Import express-handlebars
app.engine('.hbs', engine({extname: ".hbs"}));  // Create an instance of the handlebars engine to process templates
app.set('view engine', '.hbs');  

/*
    ROUTES
*/
app.get('/', function(req, res)
    {  
        res.render('index');                                                     // an object where 'data' is equal to the 'rows' we
    });  
app.get('/users', function (req, res)
    {
        res.render('users');
    });

/*
    LISTENER
*/
app.listen(PORT, function(){
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});