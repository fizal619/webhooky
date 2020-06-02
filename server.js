require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const axios = require("axios");
const routes = require("./routes");
const tasks = require("./tasks");
const app = express();
let scheduledTasks = [];

cron.schedule('*/5 * * * *', () => {
  console.log("Scanning for new credentials");
  axios.get(`${process.env.VAULT_HOST}/v1/webhooky/creds`, {
    headers: {
      "X-Vault-Token": process.env.VAULT_TOKEN
    }
  })
  .then(res => {
    //cleanup
    console.log("Cleaning up scheduled tasks");
    scheduledTasks.forEach(task => task.destroy());
    scheduledTasks = [];
    // const secrets =  app.get("secrets"); in some route
    app.set("secrets", res.data.data);
    //set up cron jobs with creds
    for (let key in tasks) {
      const task = tasks[key];
      console.log("Scheduled", task.name, "for", task.schedule);
      const temp = cron.schedule(task.schedule, ()=> {
        task.handler(res.data.data);
      });
      scheduledTasks.push(temp);
    }
    console.log("Finished scanning for new credentials.");
  })
  .catch(e => {
    console.log("Cannot reach vault.");
    //cleanup
    console.log("cleaning up scheduled tasks");
    scheduledTasks.forEach(task => task.destroy());
    scheduledTasks = [];
    for (let key in tasks) {
      const task = tasks[key];
      console.log("Scheduled", task.name, "for", task.schedule);
      const temp = cron.schedule(task.schedule, task.handler);
      scheduledTasks.push(temp);
    }
  });
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

for (let key in routes) {
  const route = routes[key];
  app[route.method](route.path, route.handler);
}

app.listen(process.env.PORT || 3000,
  ()=> console.log("SERVER STARTED ON PORT 3000")
);
