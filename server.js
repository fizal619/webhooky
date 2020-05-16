require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");
const tasks = require("./tasks");
const cron = require("node-cron");
const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

for (let key in routes) {
  const route = routes[key];
  app[route.method](route.path, route.handler);
}

for (let key in tasks) {
  const task = tasks[key];
  console.log("Scheduled", task.name, "for", task.schedule);
  cron.schedule(task.schedule, task.handler);
}

app.listen(3000, ()=> console.log("SERVER STARTED ON PORT 3000"));
