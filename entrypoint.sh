#!/bin/sh

# Start the Next.js web application
npm run start &
WEB_PID=$!

# Start the background polling worker
npm run worker &
WORKER_PID=$!

echo "Web server and worker started."

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
