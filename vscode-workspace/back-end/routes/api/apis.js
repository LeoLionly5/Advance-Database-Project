const express = require('express');
const mongoose = require('mongoose');
const PGDBpool = require('../../middlewares/pgsqlDB');

const Router = express.Router();

const MovieRC = require('../../models/MovieRC')

const pgUrl = '/pgapi' ;
const mgUrl = '/mgapi' ;
const pgAdmin = '/pgadmin'


//pgsqldb api

Router.get(pgUrl+'/getallmovies', (req, res) => {
    //console.log(req)
    console.log(req.session)
    console.log(req.params)
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid FROM public."Movie" WHERE 1=1\nORDER BY movieid ASC ', function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgAdmin+'/insertmovie/:movietitle/:added', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('INSERT INTO public."Movie"(movietitle, added)VALUES ($1, $2)', [req.params.movietitle, req.params.added], function(err, data) {
            if(err) {
                return console.error('failed to insert', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgAdmin+'/updatemovie/:movietitle/:added/:movieid/:typeid', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('UPDATE public."Movie" SET movietitle = $1, added = $2, typeid = $3 WHERE movieid = $4', [req.params.movietitle, req.params.added, req.params.typeid, req.params.movieid], function(err, data) {
            if(err) {
                return console.error('failed to update', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgAdmin+'/deletemovie/:movieid', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('DELETE FROM public."Movie" WHERE movieid = $1;', [req.params.movieid], function(err, data) {
            if(err) {
                return console.error('failed to update', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.post(pgUrl+'/lastseenmovies', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid FROM public."Movie"\
                    WHERE movieid IN (\
                    SELECT movieid FROM public."SeenMovie" WHERE userid = $1\
                    ) ORDER BY movieid ASC ', [req.body.userid], function(err, data) {
            if(err) {
                return console.error('failed to update', err);
            }
            else{
                res.status(200).json(data.rows);
                //res.redirect('/movies');
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/seemovie/:movieid', (req, res) => {
    var today = new Date().toLocaleDateString();
    console.log(today)
    PGDBpool.connect(function(err, client, done) { 
        client.query('INSERT INTO public."SeenMovie"(date, movieid, userid)VALUES ($1, $2, $3)', [today, req.params.movieid, req.session.user.userid], function(err, data) {
            if(err) {
                return console.error('failed to insert', err);
            }
            else{
                res.status(200).send(data);
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/getalltypes', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT * FROM public."MovieType" WHERE 1=1\nORDER BY typeid ASC ', function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/seenmovies', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid FROM public."Movie" WHERE movieid IN (\
                        SELECT movieid FROM public."SeenMovie" WHERE userid = $1)\
                        \nORDER BY movieid ASC ',[req.session.user.userid], function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/newmovies', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid FROM public."Movie"\
                        ORDER BY added DESC \
                        LIMIT 3', function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/recommovies/:typeid', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid FROM public."Movie" WHERE typeid = $1\
        ORDER BY movieid ASC LIMIT 3',[req.params.typeid], function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})

Router.get(pgUrl+'/mostseenmovies', (req, res) => {
    PGDBpool.connect(function(err, client, done) { 
        client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid\
                        FROM public."Movie" WHERE movieid IN\
                        (SELECT movieid FROM public."SeenMovie" GROUP BY movieid ORDER BY SUM(userid) DESC LIMIT 10)',
                        function(err, data) {
            if(err) {
                return console.error('failed to find', err);
            }
            else{
                res.status(200).json(data.rows);
            }
        });
        client.release();
    });
})


// mongodb
Router.get(mgUrl+'/add/:recomm/:rating/:movieid/:userid', (req, res) =>{
    const mrc = new MovieRC({
        _id: new mongoose.Types.ObjectId(),
        recomm: req.params.recomm,
        rating: req.params.rating,
        movieid: req.params.movieid,
        userid: req.params.userid
    })
    mrc.save()
        .then(mrc => {
            res.status(200).json({msg: "add succeed"});
        })
        .catch(err => {
            error = err;
            console.error(error);
        })
});

Router.get(mgUrl+'/highratingmovies', (req, res) =>{
    MovieRC.aggregate([
        {
            '$group': {'_id': '$movieid', '_rateAvg': {'$avg': '$rating'}}
        },
        {
            "$sort":{"_rateAvg":-1}
        },
        {
            "$limit": 10
        }
    ])
    .then(data => {
        var movies = []
        var keys = "("
        console.log(data)
        for (let key of data){
            console.log(key._id)
            keys += key._id
            keys += ", "
        }
        keys = keys.substring(0, keys.length - 2);
        keys+=")"
        console.log(keys)
        PGDBpool.connect( async function(err, client, done) { 
            await client.query('SELECT movietitle, to_char(added,\'YYYY-MM-DD\') as added , movieid, typeid\
                            FROM public."Movie" WHERE movieid IN '+keys,
                            function(err, data) {
                if(err) {
                    return console.error('failed to find', err);
                }
                else{
                    res.status(200).json(data.rows);
                }
            });
            client.release();
        });
    })
});


// Router.get('/', (req, res) =>{
// });

Router.get('/:type/:msg', (req, res) => {
});

module.exports = Router;