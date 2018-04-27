const sharp = require("sharp");
const fs = require("fs");
const pathNode = require("path");
const client = require("scp2");
var PropertiesReader = require("properties-reader");
var properties = PropertiesReader("./properties.file");
module.exports =(filename,destination) => {
  const host = properties.get("security.scp.ip").toString();
  const username = properties.get("security.scp.user").toString();
  const password = properties.get("security.scp.secret").toString();
  const path = properties.get("pictures.storage.folder").toString();

  console.log(filename,destination)
  sharp(filename)
  .resize(1000)
  .toFile(destination)
  .then(data => {
    fs.unlink(filename, err => {
      if (!err) {
        if (properties.get("server.production")) {
          client.scp(
            destination,
            { host, username, password, path },
            function(err) {
              if (!err) {
                fs.unlink(destination, err => {
                 
                     if(err) return  console.log( "error ocured when attempt to remove file ?" );
                  }
                );
              }
              if (err) console.log("error ocurred in file transefert ?");
            }
          );
        }
      } else {
        console.log("error ocured when attempt to remove file ?");
      }
    });
  });
}
     
