//Citation Scope: Node.js and database connection set up on flip and each CRUD operation. 
//Date: 08/12/2023
//Originality: Adapted
//Source: https://github.com/osu-cs340-ecampus/nodejs-starter-app/ 

// Express
var express = require('express');
var app = express();
PORT = 8018;

// Database
var db = require('./database/db-connector')

const { engine } = require('express-handlebars');
var exphbs = require('express-handlebars');     // Import express-handlebars
const { query } = require ('express');
app.engine('.hbs', engine({extname: ".hbs"}));  // Create an instance of the handlebars engine to process templates
app.set('view engine', '.hbs');  

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

/*
    ROUTES
*/

/*  --------------------- Read the Home Page ------------------------------------- */
app.get('/', function(req, res)
    {  
        res.render('index');                                                     // an object where 'data' is equal to the 'rows' we
    });  

/*  ---------------- Read and create the Users Page -------------------------- */
app.get('/users', function (req, res)
    {
        let query1= `SELECT user_id AS "User ID", user_name AS "User Name", email AS Email, password AS Password 
        FROM Users;`;
       
        db.pool.query(query1, function(error, rows, fields){  
            res.render('users', {data: rows});
            })
    });


app.post('/add-user-ajax', function(req, res, next){
    
    let data = req.body;
    let addUserQuery = `INSERT INTO Users (user_name, email, password) VALUES ('${data.username}', '${data.email}', '${data.password}');`;
    let readNewUserQuery = `SELECT * FROM Users WHERE user_name = ?;`;
    db.pool.query(addUserQuery, function (error, row, fields){
        if (error){
            console.log(error.errno);
            res.sendStatus(400);
            if (error.errno == 1062){
     
            }
        }
        else{
            db.pool.query(readNewUserQuery, [data.username], function(error, row, fields){
                if (error){
                    console.log(error);
                    res.sendStatus(400);
                }
                else{
                    console.log(row);
                    res.send(row);
                }
            })

        }
    })
})

/*  ---------------- Read and create the Friendships Page -------------------------- */

let readUserQuery = `SELECT * from Users`;
let readFriendshipQuery = `SELECT Friendships.friendship_id AS "Friendship ID", LEFT(Friendships.start_date, 10) AS "Start Date", calMulCt(user.user_id, friend.user_id) AS "Mutual Friends Count", user.user_name AS "User 1 Name", 
friend.user_name AS "User 2 Name" FROM Friendships 
INNER JOIN Users user ON Friendships.user_id = user.user_id
INNER JOIN Users friend ON Friendships.friend_user_id = friend.user_id`;
app.get('/friendships', function (req, res)
   {
      
       db.pool.query(readFriendshipQuery, function(error, friendship_rows, fields){  
         db.pool.query(readUserQuery, function(error, user_rows, fields){
             console.log(friendship_rows);
             return res.render('friendships', {data: friendship_rows, users: user_rows})
 
         })
 
 
       })
    });

app.post('/add-friendship-ajax', function(req, res, next){
    
    let data = req.body;
    let addFriendshipQuery = `INSERT INTO Friendships (start_date, mutual_friend_ct, user_id, friend_user_id) VALUES ('${data.start_date}', 'calMulCt(${data.user_id}, ${data.friend_user_id})', '${data.user_id}' , '${data.friend_user_id}' );`;
    let readNewFriendshipQuery = `${readFriendshipQuery} WHERE Friendships.user_id = ? AND Friendships.friend_user_id = ?;`;
    db.pool.query(addFriendshipQuery, function (error, row, fields){
        if (error){
            res.sendStatus(400);
        } else {
            db.pool.query(readNewFriendshipQuery, [data.user_id, data.friend_user_id], function(error, row, fields){
                if (error){
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    res.send(row);
                }
            })
            }
        })
      })

/*  ---------------- Read, create, update, and delete the Posts Page -------------------------- */
/*  ---------------- Update and delete the Posts_has_Friendships Page ------------------------- */

app.get('/posts', function (req, res)
    {
        let query1 = `SELECT Posts.post_id AS "Post ID", Posts.content AS "Content", access AS "Access", 
        user.user_name AS "User Name", GROUP_CONCAT(friend.user_name SEPARATOR', ') AS "Friends Mentioned", 
        CONCAT(Locations.address, ' ', Locations.city, ' ', 
        Locations.state, ' ', Locations.zip_code, ' ', Locations.country) AS 'Locations Pinned'
        FROM Posts
        LEFT JOIN Users user ON user.user_id = Posts.user_id
        LEFT JOIN Posts_has_Friendships ON Posts_has_Friendships.post_id = Posts.post_id
        LEFT JOIN Friendships ON Friendships.friendship_id = Posts_has_Friendships.friendship_id
        LEFT JOIN Users friend ON (CASE WHEN Posts.user_id = Friendships.user_id THEN Friendships.friend_user_id ELSE Friendships.user_id END) = friend.user_id
        LEFT JOIN Locations ON Locations.location_id = Posts.location_id
        GROUP BY Posts.post_id`;

        let query2 = `SELECT user_id, user_name FROM Users`;

        let query3 = `SELECT * FROM ((SELECT Users.user_id AS "UserID", Users.user_name AS "User", 
        Friendships.friend_user_id AS "FriendID", friends.user_name AS "Friend"
        FROM Users 
        INNER JOIN Friendships ON Friendships.user_id = Users.user_id 
        INNER JOIN Users friends ON friends.user_id = Friendships.friend_user_id) 
        UNION 
        (SELECT Users.user_id AS "UserID", Users.user_name AS "User", 
        Friendships.user_id AS "FriendID", friends.user_name AS "Friend"
        FROM Users 
        INNER JOIN Friendships ON Friendships.friend_user_id = Users.user_id 
        INNER JOIN Users friends ON friends.user_id = Friendships.user_id)) AS t
        ORDER BY t.UserID`;

        let query4 = `SELECT CONCAT(Locations.address, ' ', Locations.city, ' ', 
        Locations.state, ' ', Locations.zip_code, ' ', Locations.country) AS 'Locations', location_id
        FROM Locations`;

        let query5 = `SELECT Posts.post_id AS "Post ID", Posts.content AS "Content", access AS "Access", 
        Posts.user_id AS "User ID", user.user_name AS "User Name", GROUP_CONCAT(friend.user_name SEPARATOR', ') AS "Friends Mentioned", 
        CONCAT(Locations.address, ' ', Locations.city, ' ', 
        Locations.state, ' ', Locations.zip_code, ' ', Locations.country) AS 'Locations Pinned', Locations.location_id
        FROM Posts
        LEFT JOIN Users user ON user.user_id = Posts.user_id
        LEFT JOIN Posts_has_Friendships ON Posts_has_Friendships.post_id = Posts.post_id
        LEFT JOIN Friendships ON Friendships.friendship_id = Posts_has_Friendships.friendship_id
        LEFT JOIN Users friend ON (CASE WHEN Posts.user_id = Friendships.user_id THEN Friendships.friend_user_id ELSE Friendships.user_id END) = friend.user_id
        LEFT JOIN Locations ON Locations.location_id = Posts.location_id
        GROUP BY Posts.post_id`;

        db.pool.query(query1, function(error, rows, fields){ 
            
            let posts = rows;

            db.pool.query(query2, function(error, rows, fields){

                let users = rows;

                db.pool.query(query3, function(error, rows, fields){

                    let friendships = rows;
                    
                    db.pool.query(query4, function(error, rows, fields){
                        
                        let locations = rows;

                        db.pool.query(query5, function(error, rows, fields){

                            res.render('posts', {posts: posts, users: users, friendships: friendships, locations: locations, post_for_render: rows});  
                    })}
                    )
                })
                
            })
        })
    });

app.post('/posts-ajax', function(req, res) {
    let data = req.body;
    let location = data.location;
    // Capture NULL values
    //let location = parseInt(data.location);
        
    if (location === '') {
        location = `NULL`;
    }
        
    // First, insert into Posts
    query1 = `INSERT INTO Posts (content, access, user_id, location_id) VALUES 
        ('${data.content}', '${data.access}', '${data.userID}', ${location})`;
    
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(400);
        } else {
        // Next, for every friend mentioned, insert into the Posts_has_Friendships intersection table.
        for (let i = 0; i < data.friendList.length; i++) {
            let friend = data.friendList[i];
            query2 = `INSERT INTO Posts_has_Friendships (post_id, friendship_id) VALUES ((SELECT post_id FROM Posts WHERE 
                content = '${data.content}' AND access = '${data.access}' AND user_id = '${data.userID}'), (SELECT 
                    friendship_id FROM Friendships WHERE (user_id = '${data.userID}' AND friend_user_id = '${data.friendList[i]}') 
                    OR (user_id = '${data.friendList[i]}' AND friend_user_id = '${data.userID}')))`;
            db.pool.query(query2, function(error, rows, fields){
                if (error) {
                    console.log(error);
                    res.sendStatus(400);
                } else if (i == data.friendList.length - 1) {
                    // Finally, send back the data to be used for appending a row to the Posts table in ajax. 
                    query3 = `SELECT Posts.post_id, Posts.content AS "Content", access AS "Access", 
                    user.user_name, GROUP_CONCAT(friend.user_name SEPARATOR', ') AS "FriendsMentioned", 
                    CONCAT(Locations.address, ' ', Locations.city, ' ', 
                    Locations.state, ' ', Locations.zip_code, ' ', Locations.country) AS 'LocationsPinned'
                    FROM Posts
                    LEFT JOIN Users user ON user.user_id = Posts.user_id
                    LEFT JOIN Posts_has_Friendships ON Posts_has_Friendships.post_id = Posts.post_id
                    LEFT JOIN Friendships ON Friendships.friendship_id = Posts_has_Friendships.friendship_id
                    LEFT JOIN Users friend ON (CASE WHEN Posts.user_id = Friendships.user_id THEN Friendships.friend_user_id ELSE Friendships.user_id END) = friend.user_id
                    LEFT JOIN Locations ON Locations.location_id = Posts.location_id
                    GROUP BY Posts.post_id`;
    
                    db.pool.query(query3, function(error, rows, fields){
                        if (error) {
                            console.log(error);
                            res.sendStatus(400);
                        } else {
                            res.send(rows);
                        }
                    })
                }
            })
        }
    }
});
});
    
app.put('/put-post-ajax', function(req,res,next){
    let data = req.body;
    let location_id = parseInt(data.location_id);
    let content = data.content;
    let access = data.access;
    let friend_ids = data.friend_user_ids;
    let user_id = parseInt(data.user_id);
    let post_id = parseInt(data.post_id);
        
    if (isNaN(location_id)) {
        location_id = null;
    }
        
    update_post_content = `UPDATE Posts SET content = ? , access = ?, location_id = ? WHERE post_id = ?`;
    db.pool.query(update_post_content, [content, access, location_id, post_id], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            // Update friends mentioned
            delete_friends_mentioned = `DELETE FROM Posts_has_Friendships WHERE post_id = ?`;
    
            db.pool.query(delete_friends_mentioned, post_id, function(error, row_friendship, fields){
                if (error) {
                    console.log(error);
                    res.sendStatus(400);
                }
                else {
                    for (let i = 0; i < friend_ids.length; i++) {
                        insert_friends_mentioned = `INSERT INTO Posts_has_Friendships (post_id, friendship_id) VALUES (?, (
                            SELECT friendship_id FROM Friendships WHERE (user_id = ? AND friend_user_id = ?) OR 
                            (user_id = ? AND friend_user_id = ?)
                        ))`;
                        db.pool.query(insert_friends_mentioned, [post_id, user_id, parseInt(friend_ids[i]), parseInt(friend_ids[i]), user_id], function(error, row_friendship, fields) {
                            if (error) {
                                console.log(error);
                                res.sendStatus(400);
                }})}
                    show_updated = `SELECT Posts.post_id, Posts.content, access, 
                    user.user_name, GROUP_CONCAT(friend.user_name SEPARATOR', ') AS "Friends", 
                    CONCAT(Locations.address, ' ', Locations.city, ' ', 
                    Locations.state, ' ', Locations.zip_code, ' ', Locations.country) AS 'Locations'
                    FROM Posts
                    LEFT JOIN Users user ON user.user_id = Posts.user_id
                    LEFT JOIN Posts_has_Friendships ON Posts_has_Friendships.post_id = Posts.post_id
                    LEFT JOIN Friendships ON Friendships.friendship_id = Posts_has_Friendships.friendship_id
                    LEFT JOIN Users friend ON (CASE WHEN Posts.user_id = Friendships.user_id THEN Friendships.friend_user_id ELSE Friendships.user_id END) = friend.user_id
                    LEFT JOIN Locations ON Locations.location_id = Posts.location_id
                    GROUP BY Posts.post_id`;
                    db.pool.query(show_updated, function(error, rows, fields) {
                        res.send(rows);})
                    }
                })
        
            }})})

app.delete('/delete-post-ajax/', function(req,res,next){                                                                
    let data = req.body;
    let postID = parseInt(data.id);
    //let deletePosts = `DELETE FROM post WHERE pid = ?`;
    let deletePost= `DELETE FROM Posts WHERE post_id = ?`;
    let deletePost_Friendship = `DELETE FROM Posts_has_Friendships WHERE post_id =?`;
              
              
    // Run the 1st query
    db.pool.query(deletePost, [postID], function(error, rows, fields){
        if (error) {
              
            // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
            console.log(error);
            res.sendStatus(400);
        } else {
            db.pool.query(deletePost_Friendship, [postID], function(error, rows, fields){
                if (error) {
                    // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    res.sendStatus(204);
                }
            })
        }
    })
});


app.get('/posts-friendships', function (req, res)
    {
        let query = `SELECT posts_friendships_id AS "Posts_Friendships ID", Posts.content AS "Post Content", user.user_name AS "User", friend.user_name AS "Friend Mentioned"
        FROM Posts_has_Friendships
        INNER JOIN Posts ON Posts_has_Friendships.post_id = Posts.post_id
        INNER JOIN Friendships ON Posts_has_Friendships.friendship_id = Friendships.friendship_id
        INNER JOIN Users user ON Posts.user_id = user.user_id
        INNER JOIN Users friend ON (CASE WHEN Posts.user_id = Friendships.user_id THEN Friendships.friend_user_id ELSE Friendships.user_id END) = friend.user_id
        ORDER BY Posts_has_Friendships.posts_friendships_id`;
       
        db.pool.query(query, function(error, rows, fields){    // Execute the query

            res.render('posts-friendships', {data: rows});                  // Render the index.hbs file, and also send the renderer
        })   
    });


/*  ---------------- Read and create the Locations Page -------------------------- */
app.get('/locations', function (req, res)
    {
        let query = `SELECT Locations.location_id AS "Location ID", Locations.address AS "Address Line", Locations.city
        AS "City", Locations.state AS "State", Locations.zip_code AS "Zip Code", Locations.country AS "Country"
        FROM Locations;`;
        db.pool.query(query, function(error, rows, fields){
        res.render('locations', {data: rows});
    })
    });

app.post('/add-location-ajax', function(req, res, next){
    
    let data = req.body;
    
    let addLocationQuery = `INSERT INTO Locations (address, city, state, zip_code, country) VALUES ('${data.address}', '${data.city}', 
        '${data.state}', '${data.zipcode}', '${data.country}');`;
    let readNewLocationQuery = `SELECT * FROM Locations;`;
    db.pool.query(addLocationQuery, function (error, row, fields){
        if (error){
            console.log(error.errno);
            res.sendStatus(400);
            if (error.errno == 1062){
     
            }
        }
        else{
            db.pool.query(readNewLocationQuery, function(error, row, fields){
                if (error){
                    console.log(error);
                    res.sendStatus(400);
                }
                else{
                    console.log(row)
                    res.send(row);
                }
            })

        }
    })
  })

 


  
  /*

    LISTENER
*/
app.listen(PORT, function(){
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});
