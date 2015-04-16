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

When not running in production mode then the mem store will be used and the fixture data defined in [fixtures.js](https://github.com/ninjablocks/douitsu/blob/master/lib/fixtures.js) will be applied.

### MySQL and Redis

#### Install schema

```bash
mysql -u douitsu -p douitsu < mysql/douitsu.ddl
```
#### Running with MySQL and Redis

When running in production mode then MySQL and Redis will be used.

```bash
NODE_ENV=production node app.js
```

Run with --fixtures to apply the fixture data defined in [fixtures.js](https://github.com/ninjablocks/douitsu/blob/master/lib/fixtures.js).

```bash
NODE_ENV=production node app.js --fixtures
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

## Themes

### Style

Create your custom stylesheet under /css/theme, for example [dark.css](https://github.com/ninjablocks/douitsu/blob/master/public/css/theme/dark.css), and edit options.mine.js.

```bash
theme {
	style: '/css/theme/dark.css'
}
```

### Logo

Edit options.mine.js.

```bash
theme {
	logo: 'http://cdn.shopify.com/s/files/1/0201/1862/t/2/assets/logo.png'
}
```

### Locale

Create your custom locales under /public/locales/{language}, for example [/en/example.json](https://github.com/ninjablocks/douitsu/blob/master/public/locales/en/example.json), and edit options.mine.js.

```bash
theme {
	locale: {
      namespace: 'example'
  }
}
```

### Custom Pages

Create your custom pages under /views/theme, for example [dialog.ejs](https://github.com/ninjablocks/douitsu/blob/master/views/theme/example/dialog.ejs), and edit options.mine.js.

```bash
theme {
	page: {
      dialog: 'theme/example/dialog'
  }
}
```

# docker

Deployment and local testing is done using docker.

To build an image.

```
make build
```

To test locally.

```
make local
```

To deploy 

```
make deploy
```

To point to a docker in a vm use.

```
export DOCKER_ARGS="-H crusty.local:5555"
```

# Licensing

douitsu is licensed under the MIT License. See LICENSE for the full license text.
