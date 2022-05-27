const express = require('express');
const app = express();
const childProcess = require('child_process');
const port = 3000;

const runScript = function(scriptPath, callback) {
    let invoked = false;
    const p = childProcess.fork(scriptPath);
    
    p.on('error', (err) => {
        if (invoked) {
            return;
        }

        invoked = true;
        callback(err);
    });

    p.on('exit', (code) => {
        if (invoked) {
            return;
        }

        invoked = true;
        const err = (code === 0 ? null : new Error(`exit code ${code}`));
        callback(err);
    });
};

const mdRssPollCallback = function(err) {
    if (err) {
        console.error(err);
    }

    console.log('md-rss-poll exited - restarting in 5 seconds');
    setTimeout(() => {
        runScript('md-rss-poll/app.js', mdRssPollCallback);
    }, 5 * 1000);
};

app.use(express.static('manga'));

app.get('/', (req, res) => {
    res.send('hello world');
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
    runScript('md-rss-poll/app.js', mdRssPollCallback);
});
