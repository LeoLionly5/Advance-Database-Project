const pg = require('pg');

const config = { 
    //host : '192.168.0.20',
    host : '192.168.1.20',
    // host: '10.41.178.60',
    user:"postgres",
    database:"postgres",
    password:"postgres",
    port:10532,

    max:20,
    idleTimeoutMillis:3000,
}

const PGDBpool = new pg.Pool(config);

PGDBpool.connect(function(err, client, done) { 
    if(err) {
        return console.error('failed to connnect PGDB', err);
    }
    console.log("PGDB connected ")
});

module.exports = PGDBpool;