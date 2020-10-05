const mongoose = require('mongoose');

const MRCSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    recomm: {
        type: String,
        required: true
    },
    rating: {
        type: String,
        required: true
    },
    movieid: {
        type: Number,
        required: true
    },
    userid: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('MRC', MRCSchema);