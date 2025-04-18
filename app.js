const secret = require('./utils/secret.js');
App({
    globalData: {
        client: null ,
        ...secret,
    }
})
