require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const axios = require("axios");
const routes = require("./routes");
const tasks = require("./tasks");
const app = express();

axios.get(`${process.env.VAULT_HOST}/v1/webhooky/creds`, {
  headers: {
    "X-Vault-Token": process.env.VAULT_TOKEN
  }
})
.then(res => {
  // const secrets =  app.get("secrets"); in some route
  app.set("secrets", res.data.data);
  //set up cron jobs with creds
  for (let key in tasks) {
    const task = tasks[key];
    console.log("Scheduled", task.name, "for", task.schedule);
    cron.schedule(task.schedule, ()=> {
      task.handler(res.data.data);
    });
  }
})
.catch(e => {
  console.log("Cannot reach vault.")
  for (let key in tasks) {
    const task = tasks[key];
    console.log("Scheduled", task.name, "for", task.schedule);
    cron.schedule(task.schedule, task.handler);
  }
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
