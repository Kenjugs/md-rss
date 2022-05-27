const https = require('https');

/**
 * Returns a promise that resolves to a LoginResponse object:
 *
 * ```
 * {
 *     result: string ('ok', 'error'),
 *     token: {
 *         session: string,
 *         refresh: string
 *     }
 * }
 * ```
 */
exports.login = function () {
    const options = {
        hostname: 'api.mangadex.org',
        path: '/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = {
        username: '<your username here>',
        password: '<your password here>'
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode === 200) {
                const chunks = [];
                res.on('data', chunk => {
                    chunks.push(Buffer.from(chunk));
                });
                res.on('error', err => {
                    reject(err);
                });
                res.on('end', () => {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                });
            }
        });

        req.write(JSON.stringify(body));
        req.end();
    });
};

/**
 * Returns a promise that resolves to a CheckTokenResponse object
 *
 * ```
 * {
 *     result: string (default: 'ok'),
 *     isAuthenticated: boolean,
 *     roles: string[],
 *     permissions: string[]
 * }
 * ```
 */
exports.check = function (authToken) {
    const options = {
        hostname: 'api.mangadex.org',
        path: '/auth/check',
        method: 'GET',
        headers: {
            Authorization: `Bearer ${authToken.session}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            if (res.statusCode === 200) {
                const chunks = [];
                res.on('data', chunk => {
                    chunks.push(Buffer.from(chunk));
                });
                res.on('error', err => {
                    reject(err);
                });
                res.on('end', () => {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                });
            }
        });

        req.end();
    });
};

/**
 * Returns a promise that resolves to a RefreshTokenResponse object
 *
 * ```
 * {
 *     result: string ('ok', 'error'),
 *     token: {
 *         session: string,
 *         refresh: string
 *     },
 *     message: string
 * }
 * ```
 */
exports.refresh = function (authToken) {
    const options = {
        hostname: 'api.mangadex.org',
        path: '/auth/refresh',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = {
        token: authToken.session
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            const chunks = [];
            res.on('data', chunk => {
                chunks.push(Buffer.from(chunk));
            });
            res.on('error', err => {
                reject(err);
            });
            res.on('end', () => {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            });
        });

        req.write(JSON.stringify(body), 'utf8');
        req.end();
    });
};
