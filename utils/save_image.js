//librarry utile
const sharp = require("sharp");
const fs = require("fs");
const pathNode  = require('path');
const client = require("scp2");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");

module.exports = (publication, files,res) => {
  //const
  const host = "173.249.14.90";
  const username = "root";
  const password = "MZ9xWqTJp5dS2teU";
  const path = properties.get("pictures.storage.folder").toString();
  let response = {
    status: 0,
    message: "PUBLISHED_SUCCESSFULLY",
    publication: publication
  };

  if (files.publPicture) {
    const publLink=files.publPicture[0].filename;
    publication.publPictureLink =publLink;
    
 
    const filePath = files.publPicture[0].path;
    const destination = `${properties.get("pictures.storage.folder").toString() +
        "/" +
      publLink}`;
    var ext = pathNode.extname(publLink);
    var filename = files.publPicture[0].filename;
    console.log(destination,path)
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
                        return res.json(response);
                      } else {
                        console.log(
                          "error ocured when attempt to remove file ?"
                        );
                      }
                    });
                  }
                  if(err)
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
      client.scp(filePath, { host, username, password, path }, function(err) {
        if (!err) {
          return  res.json(response);
        }
        if (err) {
          console.log("Error Occured in Gif transfert");
        }
      });
    }
  } else {
    return  res.json(response);
  }
};
