const express = require('express');
const Bull = require('bull');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// Redis-based queue (Bull)
const taskQueue = new Bull('taskQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

// Express app setup
const app = express();
app.use(bodyParser.json());

// Log file path
const logFilePath = path.join(__dirname, 'task_log.txt');

// In-memory store to track task submission rates (rate limiting)
const userTaskCount = {};
const WINDOW_SIZE = 60 * 1000; // 1 minute window
const MAX_TASKS_PER_MINUTE = 2;
const MIN_TIME_BETWEEN_TASKS = 1000; // 1 second

// Function to check if the user can process another task
function canProcessTask(user_id) {
  const currentTime = Date.now();

  if (!userTaskCount[user_id]) {
    userTaskCount[user_id] = {
      count: 0,
      lastTaskTime: 0,
      lastReset: currentTime,
    };
  }

  // Reset task count after a minute
  if (currentTime - userTaskCount[user_id].lastReset > WINDOW_SIZE) {
    userTaskCount[user_id].count = 0;
    userTaskCount[user_id].lastReset = currentTime;
  }

  const timeSinceLastTask = currentTime - userTaskCount[user_id].lastTaskTime;

  // Allow task if the user has not exceeded the per-minute or per-second rate limits
  if (userTaskCount[user_id].count < MAX_TASKS_PER_MINUTE && timeSinceLastTask >= MIN_TIME_BETWEEN_TASKS) {
    userTaskCount[user_id].count++;
    userTaskCount[user_id].lastTaskTime = currentTime;
    return true;
  } else {
    return false;
  }
}

// Handle task requests
app.post('/task', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).send('User ID is required');
  }

  if (canProcessTask(user_id)) {
    // Process task immediately
    await task(user_id);
    return res.status(200).send('Task completed');
  } else {
    // Add the task to the queue
    taskQueue.add({ user_id });
    return res.status(200).send('Task added to queue due to rate limit exceeding');
  }
});

// Task queue processing logic (1 task per second per user)
taskQueue.process(async (job) => {
  const { user_id } = job.data;

  // Simulate task execution (rate limited to 1 per second per user)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Log task completion
  await task(user_id);
});

// Provided task function
async function task(user_id) {
  const timestamp = new Date().toISOString();
  console.log(`${user_id} - task completed at - ${timestamp}`);

  // Append log to file
  fs.appendFileSync(logFilePath, `${user_id} - task completed at - ${timestamp}\n`);
}

// Start server on port 3000
app.listen(3000, () => {
  console.log(`Server running on port 3000, worker process ${process.pid}`);
});
