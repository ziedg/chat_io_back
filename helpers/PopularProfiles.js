var Profile = require("../models/Profile");
var popularProfile = require("../models/PopularProfile");
var _ = require("lodash");
var CronJob = require("cron").CronJob;
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');
const mongoose = require('mongoose');




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
      const popularProfiles = await Profile.aggregate(query)



      _.map(popularProfiles, async profile => {
        const p = await Profile.findById(profile._id);
        if (!profile.nbReactions) {
          p.nbReactions = 0;
          await p.save();
        } else {
          p.nbReactions = profile.nbReactions;

          await p.save();

        }


      });
      const PopularProfiless = await Profile.find()
        .sort({
          nbReactions: -1
        })
        .limit(limit)
      await popularProfile.remove({})
      _.map(PopularProfiless, async profile => {
        const popularProf = new popularProfile(JSON.parse(JSON.stringify(profile)));
        await popularProf.save();
      });
    } catch (e) {
      console.log(e);

    }

  },
  true,
  "Tunisia"
);