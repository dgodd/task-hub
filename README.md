# Use CF Tasks as CGI scripts

## Deploy the TaskHub

Login to CF (the defaults are for PCFDEV). Then push the TaskHub app.

`git push`

## Edit the files in the app directoy

`echo "puts 'CGI is cool again'" > app/hello.rb`

## Run upload to create a droplet

`node upload.js`

## Use TaskHub to sping up tasks as CGI scripts

The above will give examples

