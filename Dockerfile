FROM nodesource/node:trusty

ADD . /app
WORKDIR /app

# install your application's dependencies
RUN npm install
RUN npm install gulp -g
RUN npm install bower -g
RUN bower install
RUN gulp build

# replace this with your application's default port
EXPOSE 3333

# replace this with your startup command
CMD [ "npm", "start" ]
