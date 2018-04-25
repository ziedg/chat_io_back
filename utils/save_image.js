//librarry utile
const sharp = require("sharp");
const fs = require("fs");
const pathNode = require("path");
const client = require("scp2");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

module.exports = (publication, files, res, resp, typ) => {
  //const

   const host = properties.get('storage.production')?properties.get("server.production.ip").toString(): properties.get("security.scp.ip").toString();

  const username = properties.get("security.scp.user").toString();
  const password = properties.get("security.scp.secret").toString();
  const path = properties.get("pictures.storage.folder").toString();

  if (files) {
    const publLink = files[0].filename;
    if ((typ = "pub")) publication.publPictureLink = publLink;

    const filePath = files[0].path;
    const destination = `${path+
      "/" +
      publLink}`;
    var ext = pathNode.extname(publLink);
    console.log(destination, path);
    if (ext.toLowerCase() !== ".gif") {
      sharp(filePath)
        .resize(1000)
        .toFile(destination)
        .then(data => {
          fs.unlink(filePath, err => {
            if (!err) {
              if(properties.get('storage.production')){
              client.scp(
                destination,
                { host, username, password, path },
                function(err) {
                  if (!err) {
                    fs.unlink(destination, err => {
                      if (!err) {
                        return res.json(resp);
                      } else {
                        console.log(
                          "error ocured when attempt to remove file ?"
                        );
                      }
                    });
                  }
                  if (err) console.log("error ocurred in file transefert ?");
                }
              
              );}
              

            } else {
              console.log("error ocured when attempt to remove file ?");
            }
          });
        });
    }

    //cas fichier Gif
    else {
      client.scp(filePath, { host, username, password, path }, function(err) {
        if (!err) {
          return res.json(resp);
        }
        if (err) {
          console.log("Error Occured in Gif transfert");
        }
      });
    }
  } else {
    return res.json(resp);
  }
};
