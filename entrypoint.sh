#!/bin/bash
set -e

echo "Starting Next.js web server..."
npm run start &
WEB_PID=$!

echo "Starting background worker..."
npx tsx src/worker.ts &
WORKER_PID=$!

echo "Web PID=$WEB_PID | Worker PID=$WORKER_PID"

# If either process dies, kill the other and exit
trap "kill $WEB_PID $WORKER_PID 2>/dev/null; exit 1" SIGTERM SIGINT

# Wait for either to finish
wait -n 2>/dev/null || wait $WEB_PID
EXIT_CODE=$?

echo "A process exited with code $EXIT_CODE. Shutting down..."
kill $WEB_PID $WORKER_PID 2>/dev/null
exit $EXIT_CODE
