const nodeFetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const uuid = require('uuid4');
const Zip = new require('node-zip');
const API_HOST = process.env.API_HOST || 'http://api.local.pcfdev.io';
const SPACE_NAME = process.env.SPACE_NAME || 'pcfdev-space';
const DROPLET_APP_NAME = process.env.DROPLET_APP_NAME || `task-hub-${uuid()}`;
const HUB_HOST = process.env.HUB_HOST || 'http://task-hub.local.pcfdev.io';
const APP_DIRECTORY = process.env.APP_DIRECTORY || './app';
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
    fetch('/v2/spaces').
        then(json => guids.space = json.resources.find((r) => r.entity.name == SPACE_NAME).metadata.guid).
        then(() => fetch(`/v3/apps`, { method: 'POST', body: JSON.stringify({
            name: DROPLET_APP_NAME,
            environment_variables: {},
            lifecycle: {
                type: "buildpack",
                data: {
                    buildpack: "ruby_buildpack"
                }
            },
            relationships: {
                space: {
                    guid: guids.space
                }
            }
        }), headers: {'Content-Type':'application/json' }})).
        then(res => guids.app = res.guid).
        then(() => fetch(`/v3/apps/${guids.app}/packages`, { method: 'POST', body: JSON.stringify({type: 'bits'}), headers: {'Content-Type':'application/json' }})).
        then((res) => guids.package = res.guid).
        then(() => {
            zip = Zip();
            const files = fs.readdirSync(APP_DIRECTORY);
            for (var file of files) {
                zip.file(file, fs.readFileSync(path.join(APP_DIRECTORY, file)));
            }
            const zipData = zip.generate({base64:false,compression:'DEFLATE'});
            const tmpFile = `/tmp/${uuid()}.zip`;
            fs.writeFileSync(tmpFile, zipData, 'binary');
            return fs.readFileSync(tmpFile);
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
