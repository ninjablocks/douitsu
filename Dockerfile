FROM nodesource/node:trusty

ADD . /app
WORKDIR /app

# install your application's dependencies
RUN npm install

# replace this with your application's default port
EXPOSE 3333

# replace this with your startup command
CMD [ "node", "app.js" ]
