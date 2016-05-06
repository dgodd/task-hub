const express = require('express');
const app = express();
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
const concat = require('concat-stream');

app.get('/task', function (req, res) {
    myEmitter.once('task', (a) => {
        res.send(a);
    })
});
app.post('/task', function (req, res) {
    req.pipe(concat(function(data){
        myEmitter.emit('task', data);
        res.send('OK');
    }));
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
