const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const auth = require('./authentication');
const follows = require('./follows');
const manga = require('./manga');
const logger = require('./logger');

let token = null;

const writeTokenToFile = function(token) {
    const writePath = path.join(__dirname, 'bearer.token');
    fs.writeFileSync(writePath, JSON.stringify(token), { encoding: 'utf8' });
};

const readTokenFromFile = function() {
    const readPath = path.join(__dirname, 'bearer.token');
    return JSON.parse(fs.readFileSync(readPath, { encoding: 'utf8' }));
};

const fetchAndWriteToken = async function () {
    let willWriteTokenToFile = false;
    let isTokenFileNew = false;

    // try to read token from file, if it exists
    if (token === null) {
        try {
            token = readTokenFromFile();
        } catch (error) {
            if (error.code === 'ENOENT') {
                isTokenFileNew = true;
                console.log('bearer.token file does not exist - creating...');
            } else {
                console.error(error);
            }
        }
    }

    if (token === null) {
    // if file doesn't exist, get new token by sending login request
        willWriteTokenToFile = true;

        const loginResponse = await auth.login().catch((reason) => console.error(reason));

        if (loginResponse.result === 'ok') {
            token = loginResponse.token;
        }
    } else {
    // file exists, check if token from file is still valid
        const checkResponse = await auth.check(token).catch((reason) => console.error(reason));

        if (checkResponse && checkResponse.result === 'ok' && !checkResponse.isAuthenticated) {
            // token not valid, try to refresh it
            willWriteTokenToFile = true;

            const refreshResponse = await auth.refresh(token).catch((reason) => console.error(reason));

            if (refreshResponse) {
                if (refreshResponse.result !== 'ok') {
                    // couldn't refresh token, so get new one by logging in again
                    const loginResponse = await auth.login().catch((reason) => console.error(reason));

                    if (loginResponse.result === 'ok') {
                        token = loginResponse.token;
                    }
                } else {
                    token = refreshResponse.token;
                }
            }
        }
    }

    if (willWriteTokenToFile && token !== null) {
        writeTokenToFile(token);

        if (isTokenFileNew) {
            logger.log('INFO', 'bearer.token file created', logger.COLORS.GREEN);
        }
    }
};

const getFollowedManga = async function() {
    logger.log('INFO', 'fetching currently reading followed manga');
    
    const [mangaFollowsResponse, mangaReadingResponse] = await Promise.all([
        follows.manga(token).catch((reason) => console.error(reason)),
        manga.status(token, 'reading').catch((reason) => console.error(reason))
    ]);

    if (mangaFollowsResponse === undefined || mangaReadingResponse === undefined) {
        return;
    }

    // TODO: if the followed manga list "total" is greater than the "limit" returned by the response
    // then need to request the next batch of followed manga until all followed manga have been returned

    const followedManga = mangaFollowsResponse.data;
    const readingManga = mangaReadingResponse.statuses;

    // only interested in manga the user is following with the 'reading' status
    return followedManga.filter((val) => val.id in readingManga);
};

const createNewRssXml = async function(rssManga) {
    if (rssManga === undefined) {
        return;
    }

    const xmlParser = new xml2js.Parser({
        explicitArray: false,
        explicitChildren: true,
        preserveChildrenOrder: true
    });

    // iterate over each manga in the list
    for (const m of rssManga) {
        const filePath = path.resolve(process.cwd(), 'manga', m.id);
        const filename = 'rss.xml';
        let isCreateNew = false;

        // create new folder & rss file for untracked manga
        if (!fs.existsSync(filePath)) {
            isCreateNew = true;
            fs.mkdirSync(filePath, { recursive: true });
            fs.copyFileSync(path.resolve(filePath, '../template.xml'), path.join(filePath, filename));
        }

        const rssXmlBuffer = fs.readFileSync(path.join(filePath, filename));
        const rssXmlObject = await xmlParser.parseStringPromise(rssXmlBuffer.toString('utf8')).catch((reason) => console.error(reason));

        if (rssXmlObject === undefined) {
            return;
        }

        const latestRecordedChapter = rssXmlObject.rss.channel.$$[4];
        // only interested in chapters published after the latest chapter we've tracked
        const mangaFeedResponse = await manga.feed(m.id, isCreateNew ? undefined : latestRecordedChapter.pubDate).catch((reason) => console.error(reason));

        if (mangaFeedResponse === undefined) {
            return;
        }

        const latestPublishedChapters = mangaFeedResponse.data;
        const chaptersToAppend = [];

        for (const c of latestPublishedChapters) {
            if (c.id === latestRecordedChapter.guid) {
                break;
            }

            chaptersToAppend.push({
                '#name': 'item',
                $$: [
                    {
                        '#name': 'title',
                        _: `${m.attributes.title.en} Chapter ${c.attributes.chapter}`
                    },
                    {
                        '#name': 'link',
                        _: `https://mangadex.org/chapter/${c.id}`
                    },
                    {
                        '#name': 'description',
                        _: `Title: ${c.attributes.title ? c.attributes.title : '(none)'}`
                    },
                    {
                        '#name': 'guid',
                        _: c.id
                    },
                    {
                        '#name': 'pubDate',
                        _: new Date(c.attributes.publishAt).toUTCString()
                    }
                ]
            });

            logger.log('INFO', `new chapter for " ${m.attributes.title.en} " found { chapter_id = ${c.id}, manga_id = ${m.id} }`, logger.COLORS.CYAN);
        }

        if (isCreateNew) {
            rssXmlObject.rss.channel.$$.pop();
            delete rssXmlObject.rss.channel.item;
        }

        const newXmlObject = {
            rss: {
                channel: {
                    title: m.attributes.title.en,
                    link: `https://mangadex.org/title/${m.id}/`,
                    description: rssXmlObject.rss.channel.description,
                    pubDate: new Date(m.attributes.updatedAt).toUTCString(),
                    item: []
                }
            }
        };

        if (chaptersToAppend.length > 0 || isCreateNew) {
            const prevItems = rssXmlObject.rss.channel.$$.slice(4);
            prevItems.splice(0, 0, ...chaptersToAppend);

            for (let i = 0; i < prevItems.length; ++i) {
                const newObj = {};
                newObj[prevItems[i].$$[0]['#name']] = prevItems[i].$$[0]._;
                newObj[prevItems[i].$$[1]['#name']] = prevItems[i].$$[1]._;
                newObj[prevItems[i].$$[2]['#name']] = prevItems[i].$$[2]._;
                newObj[prevItems[i].$$[3]['#name']] = prevItems[i].$$[3]._;
                newObj[prevItems[i].$$[4]['#name']] = prevItems[i].$$[4]._;
                prevItems[i] = newObj;
            }

            newXmlObject.rss.channel.item = prevItems.slice(0, 20);

            const xmlBuilder = new xml2js.Builder();
            const xml = xmlBuilder.buildObject(newXmlObject);
            fs.writeFileSync(path.join(filePath, filename), xml);

            logger.log('INFO', `new rss file written for " ${m.attributes.title.en} " : ${chaptersToAppend.length} new chapter(s) added`, logger.COLORS.GREEN);
        }
    }
};

const main = async function() {
    await fetchAndWriteToken();
    const rssManga = await getFollowedManga();
    await createNewRssXml(rssManga);

    // 15min timeout
    logger.log('INFO', 'timing out for 15 minutes');
    setTimeout(main, 15 * 60 * 1000);
};

main();
