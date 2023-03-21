// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '127.0.0.1';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 7080;

const cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function () {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});

