#!/bin/bash

PROJECT=douitsu
EB_BUCKET=ninjablocks-sphere-docker

APP_NAME=sphere-douitsu-prod
APP_ENV=sphereDouitsuProd-env

DOCKER_ARGS="-H minotaur.local:5555"
DOCKERRUN_FILE=$SHA1-Dockerrun.aws.json
