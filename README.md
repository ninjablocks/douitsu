douitsu
=======

Identity management service.

## Setup

```bash
cp options.example.js options.mine.js
npm install
```

Edit options.mine.js as needed.

## Run

```bash
node app.js
```

And open [localhost:3333](http://localhost:3333)

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

Make sure to run gulp in the background when making JavaScript changes.

```bash
gulp
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

## Feature flags

### Signup

Edit signup_enabled in [public/js/config.js](https://github.com/ninjablocks/douitsu/blob/master/public/js/config.js) to enabled / disable signup.

### Account details

Edit account_enabled in [public/js/config.js](https://github.com/ninjablocks/douitsu/blob/master/public/js/config.js) to enabled / disable updating account details.


