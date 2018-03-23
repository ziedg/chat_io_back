var Profile = require('../models/Profile');
var popularProfile = require('../models/PopularProfile');
var _ =require('lodash');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');
var CronJob = require('cron').CronJob;

var job=new CronJob('0 */15 * * * *', function() {
    console.log('start');
    Profile.find()
        .sort({
            nbLikes :-1
        })
        .limit(100)
        .exec(function (err,docs) {
            if (err){
                return console.log(err);
            }

            popularProfile.remove({}).exec(function (err,result) {
                if (err) {
                    console.log(err);
                }

            });


            _.map(docs ,function (doc) {
                var Popular =new popularProfile(JSON.parse(JSON.stringify(doc)));

                Popular.save(err => {
                    if (err) return console.log(err);
                });
            })
        });

},true,
    'Tunisia');



