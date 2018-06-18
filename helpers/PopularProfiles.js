var Profile = require("../models/Profile");
var popularProfile = require("../models/PopularProfile");
var _ = require("lodash");
var CronJob = require("cron").CronJob;
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');

var job = new CronJob(
  "* * * * * *",
  async function() {
    try {
      const limit=Number(properties.get('config.limit'))
      await popularProfile.remove({});
      const popularProfiles = await Profile.find()
        .sort({
          nbLikes: -1
        })
        .limit(limit);
     
    

      _.map(popularProfiles, async profile => {
        var popularProf = await new popularProfile(
          JSON.parse(JSON.stringify(profile))
        );
        await popularProf.save();
      });
    } catch (e) {
      console.log("err");

    }
  },
  true,
  "Tunisia"
);
