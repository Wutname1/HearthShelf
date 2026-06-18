#!/bin/sh
envsubst '${ABS_SERVER_URL}' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
exec "$@"
