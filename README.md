douitsu
=======

Identity management service.

## Setup

```bash
cp options.example.js options.mine.js
npm install
```

Edit options.mine.js as needed, including switching on/off feature flags.

### Environment variables

The following environment variables override what's defined in options.mine.js if they are set.

Environment variable | Description | Example
--- | --- | ---
NODE_ENV | Platform environment | production
DB_URL | Database URL | mysql://douitsu:douitsu@localhost:3306/douitsu
CACHE_URL | Redis URL | redis://localhost
LDAP_URL | LDAP URL | ldap://localhost/dc=ec2,dc=internal

## Run

```bash
node app.js
```

And open [localhost:3333](http://localhost:3333)

### Mem store and fixture data

When not running in production mode then the mem store will be used and the following fixture data will be applied:

Entity | Value
--- | ---
User | u1@example.com with password u1
User | u2@example.com with password u2
Application | Application app1 by u1@example.com
Access token | Token i1afk49ulwybf46j4cwkhe7ejt121m3no1r0d3eg for app1 authorized by u1@example.com

Run the following to use MySQL and Redis locally and apply the above fixture data:

```bash
node app.js --env=production --fixtures
```

### Admin

Open [localhost:3333](http://localhost:3333), login with an admin user (admin credentials defined in options.mine.js) and go to [localhost:3333/admin](http://localhost:3333/admin).

### Testing OAuth Provider

Follow README in [example-oauth2orize-consumer](https://github.com/chico/example-oauth2orize-consumer).

## Gulp

Gulp does the following:
* Lint JavaScript files
* Concatenate JavaScript files
* Minify and rename said concatenated files
* Watch for file changes and do the above on the fly

### Install globally

```bash
npm i -g gulp
```

### Run

Make sure to run gulp in the background when making file changes:

```bash
gulp
```

To build without watching for file changes:

```bash
gulp build
```

## Bower

### Install globally

```bash
npm install -g bower
```

### Run

Front-end dependencies are defined in [bower.js](https://github.com/ninjablocks/douitsu/blob/master/bower.js) and will be placed in public/bower_components (see [.bowerrc](https://github.com/ninjablocks/douitsu/blob/master/bowerrc)).

```bash
bower install
```

## MySQL

### Install schema

```bash
mysql -u douitsu -p douitsu < mysql/douitsu.ddl
```



