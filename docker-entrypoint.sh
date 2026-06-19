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

# Start the QuestGiver backend in the background. It reads its provider key,
# rate limit, and ABS_SERVER_URL from the environment. nginx proxies /qg/* to it
# on localhost:8080. If it exits, nginx still serves the SPA (the client falls
# back to the heuristic recommender when /qg is unreachable).
if [ -f /app/server/index.js ]; then
  QG_PORT=8080 node /app/server/index.js &
fi

exec "$@"
