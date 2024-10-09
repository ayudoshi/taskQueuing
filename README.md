<h1>User Task Queuing with Rate Limiting in a Node.js API Cluster</h1>

<h2>Technical Stack</h2>
•	Node.js: Core framework for the API server.<br>
•	Express: To handle HTTP routes.<br>
•	Redis: Used by Bull as the backend for queuing tasks.<br>
•	Bull: A Redis-based task queue.<br>
•	Cluster: Node.js cluster module to scale the application using multiple workers.<br>
•	File System (fs): For logging task completion.

<h2>File Structure</h2>
1.	index.js:<br>
o	Sets up the Node.js cluster with two worker processes.<br>
o	Distributes incoming requests between the workers.<br>
o	Resilient to worker crashes—automatically restarts any failed worker.<br>
2.	server.js:<br>
o	Implements the task processing logic, including rate limiting and queuing.<br>
o	Handles HTTP routes for adding tasks and logs task completions to a file.

<h2>Explanation of index.js (Cluster Setup)</h2>
•	Clustering: The cluster module forks two worker processes from the main process.<br>
These worker processes handle the actual request load, distributing the workload across multiple CPUs. If a worker crashes or exits, a new one is automatically forked, providing resilience.<br>
•	Load Distribution: The master process distributes incoming tasks between worker processes. This helps balance the load when multiple requests are made to the API.

<h2>Explanation of server.js (Task Handling, Queuing, and Rate Limiting)</h2>
1. Rate Limiting<br>
•	Each user ID can submit a maximum of 1 task per second and 20 tasks per minute.<br>
•	The logic is implemented using an in-memory store (userTaskCount) that tracks the number of tasks submitted by each user and enforces rate limits.<br>
2. Task Queueing<br>
•	If a user's rate limit is exceeded, the request is queued in Redis using Bull.<br>
•	Bull is a highly performant, Redis-based task queue that handles delayed jobs.<br>
•	Queued tasks are processed later when the rate limit is reset.<br>
3. Task Processing<br>
•	Tasks are processed by the queue, with a delay of 1 second per task per user.<br>
•	Upon completion, the task is logged in a file (task_log.txt) with the user ID and timestamp.<br>
4. Logging<br>
•	Task completion is logged to both the console and a file (task_log.txt) in the project directory.<br>
•	The log stores the user ID and the exact time the task was completed.<br>

<h2>Assumptions</h2>
1.	Redis Setup: The project assumes that Redis is installed and running on localhost:6379 for Bull to work correctly.<br>
2.	Rate Limiting Per User: The rate limiting is implemented on a per-user basis, meaning that tasks are tracked and limited based on individual user_ids.<br>
3.	No Persistence for Rate Limiting: The rate limiting data (userTaskCount) is stored in memory, so rate limiting only applies while the server is running. If the server restarts, rate limiting data is lost.<br>

<h2>How to Run the Project</h2>
1.	Ensure Redis is installed and running on localhost:6379.<br>
2.	Open the terminal in the project folder and install node modules using “npm i” command.<br>
3.	Run the cluster setup using:<br>
node index.js<br>
This will start the master process and two worker processes.<br>
4.	Test the API by sending a POST request to /task with a user_id:<br>
{<br>
  "user_id": "123"<br>
}<br>
•  If the user is within the rate limit, you'll get a "Task completed" response.<br>
•  If the user exceeds the rate limit, you'll get "Task added to queue".<br>


