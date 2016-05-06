
### Get a space
cf curl /v2/spaces | jq '.resources[] |  .metadata.guid + " " + .entity.name'

### Create an app
cf curl /v3/apps \
  -X POST \
  -d '{
    "name": "lambda-hello2",
    "environment_variables": {},
    "lifecycle": {
      "type": "buildpack",
      "data": {
        "buildpack": "ruby_buildpack"
      }
    },
    "relationships": {
      "space": {
        "guid": "4c2fc781-0c65-449d-bf33-a7e0a41381b0"
      }
    }
  }'

#### "guid": "f358d7cc-b29c-4d35-97c8-045f56901247",

### Create a package

cf curl /v3/apps/f358d7cc-b29c-4d35-97c8-045f56901247/packages \
  -X POST \
  -d '{
    "type": "bits"
  }'

#### "guid": "98440466-9bb5-4293-8fce-0e99c4d07edb"

### Upload bits

```
cf oauth-token
curl "http://api.local.pcfdev.io/v3/packages/98440466-9bb5-4293-8fce-0e99c4d07edb/upload" \
  -F bits=@"lambda-hello.zip" \
  -X POST \
  -H "Authorization: bearer eyJhbGciOiJSUzI1NiJ9.eyJqdGkiOiI1ZTcwZWE2NC1jNDNmLTQzM2QtODE4Yy1jNWIzZDgwMmZmNzgiLCJzdWIiOiI3MjJjMDBiZS1hNzlmLTRiNjctYjY5YS1iMTcwNDNjMTZkOWMiLCJzY29wZSI6WyJyb3V0aW5nLnJvdXRlcl9ncm91cHMucmVhZCIsImNsb3VkX2NvbnRyb2xsZXIucmVhZCIsInBhc3N3b3JkLndyaXRlIiwiY2xvdWRfY29udHJvbGxlci53cml0ZSIsIm9wZW5pZCIsImRvcHBsZXIuZmlyZWhvc2UiLCJzY2ltLndyaXRlIiwic2NpbS5yZWFkIiwiY2xvdWRfY29udHJvbGxlci5hZG1pbiIsInVhYS51c2VyIl0sImNsaWVudF9pZCI6ImNmIiwiY2lkIjoiY2YiLCJhenAiOiJjZiIsImdyYW50X3R5cGUiOiJwYXNzd29yZCIsInVzZXJfaWQiOiI3MjJjMDBiZS1hNzlmLTRiNjctYjY5YS1iMTcwNDNjMTZkOWMiLCJvcmlnaW4iOiJ1YWEiLCJ1c2VyX25hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW4iLCJyZXZfc2lnIjoiN2M1ZTdiYjciLCJpYXQiOjE0NjI1NDM5MDksImV4cCI6MTQ2MjU0NDUwOSwiaXNzIjoiaHR0cDovL3VhYS5sb2NhbC5wY2ZkZXYuaW8vb2F1dGgvdG9rZW4iLCJ6aWQiOiJ1YWEiLCJhdWQiOlsic2NpbSIsImNsb3VkX2NvbnRyb2xsZXIiLCJwYXNzd29yZCIsImNmIiwidWFhIiwib3BlbmlkIiwiZG9wcGxlciIsInJvdXRpbmcucm91dGVyX2dyb3VwcyJdfQ.ZKl_DtoshIP2Apm-Hnt0ipEFhr4vYta0wijW0YTgeeAonNp1kdDMr_IIFAH2ljpNOiSdI-A1VOuzC8tCt1vUHK0Ul630wsq5ZMuVVf5kG3JPXAVpJ2JvCX4-5S53XfWXsgcyI3ccaaEZr20rxTJfjp0KzFDgtcmrMKJDSAlOhS4"
```

#### "guid": "98440466-9bb5-4293-8fce-0e99c4d07edb"
#### Wait for ready `cf curl /v3/packages/98440466-9bb5-4293-8fce-0e99c4d07edb`

### Stage package

cf curl /v3/packages/98440466-9bb5-4293-8fce-0e99c4d07edb/droplets \
  -X POST \
  -d '{
    "environment_variables": {
      "CUSTOM_ENV_VAR": "hello"
    },
    "lifecycle": {
      "type": "buildpack",
      "data": {
        "buildpack": "ruby_buildpack",
        "stack": "cflinuxfs2"
      }
    }
  }'

#### "guid": "9c174998-d899-4a61-8095-f78adf50e911" (Same as above)
#### Wait for ready `cf curl /v3/packages/98440466-9bb5-4293-8fce-0e99c4d07edb`

### Create a droplet
```
cf curl /v3/packages/98440466-9bb5-4293-8fce-0e99c4d07edb/droplets \
  -X POST \
  -d '{
    "environment_variables": {
      "CUSTOM_ENV_VAR": "hello"
    },
    "lifecycle": {
      "type": "buildpack",
      "data": {
        "buildpack": "ruby_buildpack",
        "stack": "cflinuxfs2"
      }
    }
  }'
```

#### "guid": "a9b47ec3-d120-45a5-9ebc-9e891e40224a"
#### Wait for staged `cf curl /v3/droplets/a9b47ec3-d120-45a5-9ebc-9e891e40224a`

### Create a task
```
cf curl /v3/apps/f358d7cc-b29c-4d35-97c8-045f56901247/tasks \
  -X POST \
  -d '{
    "droplet_guid": "a9b47ec3-d120-45a5-9ebc-9e891e40224a",
    "name": "hello",
    "command": "./hello.rb"
  }'
```

#### "guid": "17d9da57-1dec-4469-a39e-4e14a5237e5a"
#### Wait for ???? `cf curl /v3/tasks/17d9da57-1dec-4469-a39e-4e14a5237e5a`



















cf curl /v3/apps/f358d7cc-b29c-4d35-97c8-045f56901247/tasks \
  -X POST \
  -d '{
    "droplet_guid": "a9b47ec3-d120-45a5-9ebc-9e891e40224a",
    "name": "hello",
    "command": "pwd ; echo ; ls"
  }' | jq '.guid'
cf curl /v3/tasks/364a9c39-2c0c-41c0-9979-5a499531c2ff








