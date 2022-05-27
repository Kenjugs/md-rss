const https = require('https');

/**
 * Returns a promise that resolves to a FollowedMangaResponse object
 *
 * ```
 * {
 *     result: string (default: 'ok'),
 *     response: string (default: 'collection'),
 *     data: Manga[],
 *     limit: number,
 *     offset: number,
 *     total: number
 * }
 * ```
 */
exports.manga = function (authToken) {
    const options = {
        hostname: 'api.mangadex.org',
        path: '/user/follows/manga?limit=50',
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
            } else {
                reject(res.statusMessage);
            }
        });

        req.end();
    });
};
