const http = require('http');
const https = require('https');
const url = require('url');

const port = process.env.PORT || 8080;

// CORS headers to allow all origins
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
};

// Helper function to send error responses
const sendError = (res, statusCode, message) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        ...corsHeaders
    });
    res.end(JSON.stringify({ error: message }));
};

const server = http.createServer((req, res) => {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    try {
        // Parse the URL and get the target URL
        const parsedUrl = url.parse(req.url, true);
        const targetUrl = parsedUrl.query.url;

        // Validate target URL
        if (!targetUrl) {
            return sendError(res, 400, 'Missing "url" query parameter');
        }

        try {
            // Validate URL format
            new URL(targetUrl);
        } catch (e) {
            return sendError(res, 400, 'Invalid URL format');
        }

        // Parse target URL
        const parsedTargetUrl = url.parse(targetUrl);

        // Configure proxy request options
        const options = {
            hostname: parsedTargetUrl.hostname,
            port: parsedTargetUrl.port || (parsedTargetUrl.protocol === 'https:' ? 443 : 80),
            path: parsedTargetUrl.path,
            method: req.method,
            headers: {
                ...req.headers,
                host: parsedTargetUrl.hostname, // Update host header to match target
            }
        };

        // Remove headers that might cause issues
        delete options.headers['host'];
        delete options.headers['connection'];

        // Create proxy request
        const proxyRequest = (parsedTargetUrl.protocol === 'https:' ? https : http).request(options, (proxyResponse) => {
            // Add CORS headers to the proxied response
            const responseHeaders = {
                ...proxyResponse.headers,
                ...corsHeaders
            };

            res.writeHead(proxyResponse.statusCode, responseHeaders);
            proxyResponse.pipe(res, { end: true });
        });

        // Handle proxy request errors
        proxyRequest.on('error', (error) => {
            console.error('Proxy request error:', error);

            // Determine appropriate error message and status code
            let statusCode = 500;
            let errorMessage = 'Internal server error';

            if (error.code === 'ECONNREFUSED') {
                statusCode = 503;
                errorMessage = 'Unable to connect to target server';
            } else if (error.code === 'ENOTFOUND') {
                statusCode = 404;
                errorMessage = 'Target host not found';
            } else if (error.code === 'ETIMEDOUT') {
                statusCode = 504;
                errorMessage = 'Request timeout';
            }

            sendError(res, statusCode, errorMessage);
        });

        // Handle timeouts
        proxyRequest.setTimeout(30000, () => {
            proxyRequest.destroy();
            sendError(res, 504, 'Request timeout');
        });

        // Pipe the incoming request to the proxy request
        req.pipe(proxyRequest, { end: true });

        // Handle client request errors
        req.on('error', (error) => {
            console.error('Client request error:', error);
            proxyRequest.destroy();
            sendError(res, 400, 'Client request error');
        });

    } catch (error) {
        console.error('Server error:', error);
        sendError(res, 500, 'Internal server error');
    }
});

// Handle server-level errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

server.listen(port, () => {
    console.log(`CORS proxy server running on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});