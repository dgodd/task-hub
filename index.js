const express = require('express');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const concat = require('concat-stream');
const uuid = require('uuid4');
const appEnv = require('cfenv').getAppEnv();

const app = express();
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const API_HOST = process.env.API_HOST || 'api.local.pcfdev.io';
const APP_URL = appEnv.url;

app.get('/apps/:appGuid/:dropletGuid/:command', function (req, res) {
    if(!req.get('Authorization')) { res.send('Authorization required'); return }
    const id = uuid();
    const eventName = `task-${id}`;
    const appGuid = req.params.appGuid;
    const dropletGuid = req.params.dropletGuid;
    const command = req.params.command;
    const resSend = (data) => {
        console.log(['receive', eventName, data]);
        res.send(data);
    };
    myEmitter.once(eventName, resSend);

    fetch(`${API_HOST}/v3/apps/${appGuid}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
            droplet_guid: dropletGuid,
            name: eventName,
            command: `(${command}) | curl ${APP_URL}/task/${id} -d @- -H 'Content-Type: text/plain' --insecure`
        }),
        headers: {
            'Content-Type':'application/json',
            Authorization: req.get('Authorization')
        }
    }).
    then(res => res.json()).
    then(data => console.log(`Task Guid is ${data.guid}`)).
    catch(e => {
        console.log(e);
        res.send('ERROR');
        myEmitter.removeListener(eventName, resSend);
        return;
    })
});
app.post('/task/:id', function (req, res) {
    const eventName = `task-${req.params.id}`;
    console.log(eventName);
    req.pipe(concat(function(data){
        console.log(['send', eventName, data]);
        myEmitter.emit(eventName, data);
        res.send('OK');
    }));
});

app.listen(appEnv.port, function () {
    console.log(`Example app listening on port ${appEnv.port}!`);
});
