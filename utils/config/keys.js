
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('properties.file');


module.exports ={
    VAPIDKEYS:
        {"publicKey":"BHn00d_6fnohGvH7qt91DmK3t6FhJGXPThdJ5ixYd_iU6X0noS0-KkpKfTIhgM141g8pXTFgh3VLzAxLPrk0Yps",
        "privateKey":"ubN1c78vu39ARkhgv5g2xa0eTLvOZU-_OEWQ7MMrGG0"
    },
    SERVERURL:properties.get('server.environment').toString()=='production'?'https://speegar.com':'https://integration.speegar.com'
    
}