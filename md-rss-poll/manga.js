const https = require('https');

/**
 * Returns a promise that resolves to a MangaStatusResponse object
 *
 * ```
 * {
 *     result: string (default: 'ok'),
 *     statuses: {
 *         [manga_id]: string (enum: 'reading' 'on_hold' 'plan_to_read' 'dropped' 're_reading' 'completed')
 *     }
 * }
 * ```
 */
exports.status = function (authToken, status) {
    const options = {
        hostname: 'api.mangadex.org',
        path: `/manga/status?status=${status}`,
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
 * Returns a promise that resolves to a MangaFeedResponse object
 *
 * ```
 * {
 *     result: string (default: 'ok'),
 *     response: string (default: 'collection'),
 *     data: Chapter[],
 *     limit: number,
 *     offset: number,
 *     total: number
 * }
 * ```
 */
exports.feed = function (mangaId, since) {
    let dateTimeString = '';

    if (since !== undefined && Object.keys(since).length !== 0) {
        const d = new Date(since);
        // const year = d.getUTCFullYear().toString();
        // const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        // const date = d.getUTCDate().toString().padStart(2, '0');
        // const hour = d.getUTCHours().toString().padStart(2, '0');
        // const minute = d.getUTCMinutes().toString().padStart(2, '0');
        // const second = d.getUTCSeconds().toString().padStart(2, '0');

        // dateTimeString = `${year}-${month}-${date}T${hour}:${minute}:${second}`;
        dateTimeString = d.toISOString().substring(0, d.toISOString().indexOf('.'));
    }

    const options = {
        hostname: 'api.mangadex.org',
        path: `/manga/${mangaId}/feed?limit=20&translatedLanguage[]=en&order[publishAt]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`,
        method: 'GET'
    };

    if (dateTimeString !== '') {
        options.path += `&publishAtSince=${dateTimeString}`;
    } else {
        options.path += '&publishAtSince=2000-01-01T00:00:00';
    }

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
