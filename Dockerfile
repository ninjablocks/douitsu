FROM nodesource/trusty:0.10.43

ADD . /app
WORKDIR /app

RUN npm install
# install your application's dependencies
RUN npm rebuild

# replace this with your application's default port
EXPOSE 3333

# replace this with your startup command
CMD [ "node", "app.js" ]
