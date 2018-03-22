const mongoose =require('mongoose');
var Profile = require('../models/Profile');
var popularProfile = require('../models/PopularProfile');
var _ =require('lodash');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');


mongoose.connect(`mongodb://${properties.get('mongo.url')}/${properties.get('mongo.db.name')}`);
var db =mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("connected!")
});


Profile.find()
    .sort({
        nbLikes :-1
    })
    .limit(100)
    .exec(function (err,docs) {
    if (err){
        return console.log(err);
    }
        db.dropCollection('popularprofiles', function(err, result) {
            if (err) console.log('error while deleting',err);
        });


        _.map(docs ,function (doc) {

         var Popular =new popularProfile(JSON.parse(JSON.stringify(doc)));

        Popular.save(err => {
            if (err) return console.log(err);
    });
    })
    });



