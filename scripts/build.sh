#!/bin/bash

SHA1=$1

source $(dirname $0)/common.sh

docker $DOCKER_ARGS build -t "docker-registry.ninjablocks.co/ninjablocks/$PROJECT:$SHA1" .