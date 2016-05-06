const express = require('express');
const EventEmitter = require('events');
const rest = require('restler');
const concat = require('concat-stream');
const uuid = require('uuid4');

const app = express();
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// const appGuid = 'f358d7cc-b29c-4d35-97c8-045f56901247';
// const dropletGuid = 'a9b47ec3-d120-45a5-9ebc-9e891e40224a';
// const command = 'ruby ./hello.rb';
// time curl -i 'lambda-task.local.pcfdev.io/apps/f358d7cc-b29c-4d35-97c8-045f56901247/a9b47ec3-d120-45a5-9ebc-9e891e40224a/ruby%20hello.rb' -H "Authorization: `cf oauth-token`"

// app.get('/task', function (req, res) {
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

    rest.post(`http://api.local.pcfdev.io/v3/apps/${appGuid}/tasks`, {
        data: {
            droplet_guid: dropletGuid,
            name: eventName,
            command: `(${command}) | curl lambda-task.local.pcfdev.io/task/${id} -d @- -H 'Content-Type: text/plain'`
        },
        headers: {
            Authorization: req.get('Authorization')
        }
    }).on('complete', function(data, response) {
        if (response.statusCode == 202) {
            console.log(`Task Guid is ${data.guid}`);
        } else {
            res.send('ERROR');
            myEmitter.removeListener(eventName, resSend);
            return;
        }
    });
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

const port = process.env.PORT || 8000;
app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
