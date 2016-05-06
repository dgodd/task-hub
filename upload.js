const nodeFetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Zip = new require('node-zip');
const API_HOST = process.env.API_HOST || 'http://api.local.pcfdev.io';
const SPACE_NAME = process.env.SPACE_NAME;
const DROPLET_APP_NAME = process.env.DROPLET_APP_NAME || 'lambda-hello2';
const HUB_HOST = process.env.HUB_HOST || 'http://lambda-task.local.pcfdev.io';
var headers = {};
var guids = {};

const fetch = (path, options = {}) => {
    options.headers = Object.assign({}, headers, options.headers);
    console.log(path);
    return nodeFetch(API_HOST + path, options).then(res => res.json());
};
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));
var zip = new require('node-zip')();
zip.file('test.file', 'hello there');
var data = zip.generate({base64:false,compression:'DEFLATE'});
const doUpload = () => {
    fetch('/v3/apps').
        // FIXME - Create app if not exist
        then(json => guids.app = json.resources.find((r) => r.name == DROPLET_APP_NAME).guid).
        then(() => fetch(`/v3/apps/${guids.app}/packages`, { method: 'POST', body: JSON.stringify({type: 'bits'}), headers: {'Content-Type':'application/json' }})).
        then((res) => guids.package = res.guid).
        then(() => {
            zip = Zip();
            // zip.file('hello.rb', "#!/usr/bin/env ruby\n\nputs 'Hi Mom'\n");
            const files = fs.readdirSync('./app_ruby/');
            console.log(files);
            for (var file of files) {
                zip.file(file, fs.readFileSync(path.join('./app_ruby/', file)));
            }
            const zipData = zip.generate({base64:false,compression:'DEFLATE'});
            fs.writeFileSync('test.zip', zipData, 'binary');
            return fs.readFileSync('test.zip');
        }).
        then(zipData => {
            var form = new FormData();
            form.append('bits', zipData, {
                filename: 'data.zip',
                contentType: 'application/binary'
            });
            return fetch(`/v3/packages/${guids.package}/upload`, { method: 'POST', body: form })
        }).
        then(() => sleep(10000)).
        then(() => fetch(`/v3/packages/${guids.package}`)).
        then(res => assert(res.state == 'READY')).
        then(() => fetch(`/v3/packages/${guids.package}/droplets`, { method: 'POST', body: JSON.stringify({
            environment_variables: {
                CUSTOM_ENV_VAR: "hello"
            },
            lifecycle: {
                type: "buildpack",
                data: {
                    buildpack: "ruby_buildpack",
                    stack: "cflinuxfs2"
                }
            }
        }), headers: {'Content-Type':'application/json' }})).
        then(res => guids.droplet = res.guid).
        then(() => sleep(10000)).
        then(() => fetch(`/v3/droplets/${guids.droplet}`)).
        then((res) => {
            console.log(res);
            assert(res.state == 'STAGED');
            console.log('Staged successfully');
            console.log(`curl -i ${HUB_HOST}/apps/${guids.app}/${guids.droplet}/[COMMAND] -H "Authorization: \`cf oauth-token\`"`);
            console.log(`curl -i ${HUB_HOST}/apps/${guids.app}/${guids.droplet}/ruby%20hello.rb -H "Authorization: \`cf oauth-token\`"`);
        }).
        catch(console.log);
};

const spawn = require( 'child_process' ).spawn;
const token = spawn( 'cf', [ 'oauth-token' ] );
token.stdout.on( 'data', ( data ) => {
    headers.Authorization = data.toString().trim();
    doUpload();
});
token.stderr.on( 'data', ( data ) => {
    console.log( `stderr: ${data}` );
});
token.on( 'close', ( code ) => {
    console.log( `child process exited with code ${code}` );
});
