var Profile = require("../models/Profile");
var popularProfile = require("../models/PopularProfile");
var _ = require("lodash");
var CronJob = require("cron").CronJob;
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');
const mongoose = require('mongoose');



mongoose.connect(
    `mongodb://${properties.get("mongo.url")}/${properties.get("mongo.db.name")}`
  ).then(() => {
    console.log("connect TO DB...")
  })
  .catch((e) => {
    console.log("Unable to connect to DB.", e)
  })

var query = [{
    "$project": {
      "nbLikes": 1,
      "nbLoves": 1,
      "nbReactions": {
        "$add": ["$nbLikes", "$nbLoves"]
      }
    }
  },
  {
    "$sort": {
      "nbReactions": -1
    }
  }

];

var job = new CronJob(
  "* 00 * * * *",
  async function () {
    try {
      const limit = Number(properties.get('config.limit'))
      await popularProfile.remove({});
      const popularProfiles = await Profile.aggregate(query)
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