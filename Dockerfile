FROM mhart/alpine-node:0.12

ADD . /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git && \ 
    npm install && \
    npm rebuild && \
    npm install gulp -g && \
    gulp build && \
    npm uninstall gulp -g && \
    apk del make gcc g++ python git

# replace this with your application's default port
EXPOSE 3333

# replace this with your startup command
CMD [ "node", "app.js" ]
