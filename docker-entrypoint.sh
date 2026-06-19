#!/bin/sh
set -e

# Substitute runtime config into the server block and the shared proxy snippet.
# Only ${ABS_SERVER_URL} and ${PUBLIC_URL} are replaced; nginx's own $variables
# are left intact.
envsubst '${ABS_SERVER_URL} ${PUBLIC_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

envsubst '${ABS_SERVER_URL} ${PUBLIC_URL}' \
  < /etc/nginx/templates/abs_proxy.conf.template \
  > /etc/nginx/abs_proxy.conf

# Static http-scope map (no substitution needed).
cp /etc/nginx/templates/upgrade-map.conf /etc/nginx/conf.d/upgrade-map.conf

exec "$@"
