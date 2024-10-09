const cluster = require('cluster');

// Number of worker processes (two for your two replicas)
const numCPUs = 2; // You can also use os.cpus().length to match number of CPU cores

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers (2 replicas)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new one.`);
    cluster.fork(); // Restart worker if it dies
  });
} else {
  // Worker processes run the server
  require('./server'); // Load the server file
}
