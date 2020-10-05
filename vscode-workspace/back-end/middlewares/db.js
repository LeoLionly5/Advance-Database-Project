const mongoose = require('mongoose');

const connectDB = {};
var conn = false;

connectDB.connect = async () => {
    try{
        conn = await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch (error) {
        console.log(error);
        process.exit(1);
    }
}

connectDB.close = () => {
    mongoose.connection.close();
}

module.exports = connectDB;