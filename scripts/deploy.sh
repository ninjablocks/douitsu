#!/bin/bash

SHA1=$1

source $(dirname $0)/common.sh

docker $DOCKER_ARGS push "docker-registry.ninjablocks.co/ninjablocks/$PROJECT:$SHA1"

# Create new Elastic Beanstalk version
sed "s/<TAG>/$SHA1/" < Dockerrun.aws.json.template > $DOCKERRUN_FILE
aws s3 cp $DOCKERRUN_FILE s3://$EB_BUCKET/$DOCKERRUN_FILE
aws elasticbeanstalk create-application-version --application-name $APP_NAME \
  --version-label $SHA1 --source-bundle S3Bucket=$EB_BUCKET,S3Key=$DOCKERRUN_FILE

# Update Elastic Beanstalk environment to new version
aws elasticbeanstalk update-environment --environment-name $APP_ENV \
    --version-label $SHA1
