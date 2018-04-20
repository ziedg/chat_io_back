//librarry utile
const sharp = require("sharp");
const fs = require("fs");
const pathNode  = require('path');
const client = require("scp2");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

module.exports = (publication, files) => {
  //const
  const host = "173.249.14.90";
  const username = "root";
  const password = "MZ9xWqTJp5dS2teU";
  const path = properties.get("pictures.storage.folder").toString();
  response = {
    status: 0,
    message: "PUBLISHED_SUCCESSFULLY",
    publication: publication
  };

  if (files.publPicture) {
    publication.publPictureLink = files.publPicture[0].filename;
    var filePath = files.publPicture[0].path;
    var destination = `${properties.get("pictures.storage.folder").toString() +
      "/" +
      files.publPicture[0].filename}`;
    var ext = pathNode.extname(files.publPicture[0].filename);
    var filename = files.publPicture[0].filename;

    if (ext.toLowerCase() !== ".gif") {
      sharp(filePath)
        .resize(1000)
        .toFile(destination)
        .then(data => {
          fs.unlink(filePath, err => {
            if (!err) {
              client.scp(
                destination,
                { host, username, password, path },
                function(err) {
                  if (!err) {
                    fs.unlink(destination, err => {
                      if (!err) {
                        return response;
                      } else {
                        console.log(
                          "error ocured when attempt to remove file ?"
                        );
                      }
                    });
                  }
                  console.log("error ocurred in file transefert ?");
                }
              );
            } else {
              console.log("error ocured when attempt to remove file ?");
            }
          });
        });
    }

    //cas fichier Gif
    else {
      client.scp(Ofile, { host, username, password, path }, function(err) {
        if (!err) {
          return response;
        }
        if (err) {
          console.log("Error Occured in Gif transfert");
        }
      });
    }
  } else {
    return response;
  }
};
