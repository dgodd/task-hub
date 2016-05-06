const express = require('express');
const app = express();
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
const concat = require('concat-stream');

app.get('/task/:id', function (req, res) {
    const eventName = 'task-' + req.params.id;
    myEmitter.once(eventName, (a) => {
        console.log(eventName);
        res.send(a);
    })
});
app.post('/task/:id', function (req, res) {
    const eventName = 'task-' + req.params.id;
    req.pipe(concat(function(data){
        myEmitter.emit(eventName, data);
        res.send('OK');
    }));
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
