/** @type {import('next').NextConfig} */
var env = require('./.env.js');
module.exports = {
  reactStrictMode: true,
  env: {
    // firebase config
    fc_apiKey: env.fc_apiKey,
    fc_authDomain:  env.fc_authDomain,
    fc_projectId:  env.fc_projectId,
    fc_storageBucket:  env.fc_storageBucket,
    fc_messagingSenderId:  env.fc_messagingSenderId,
    fc_appId: env.fc_appId,
    fc_measurementId:  env.fc_measurementId,
    // collection name,
    collectionName: env.collectionName,
  }
}
