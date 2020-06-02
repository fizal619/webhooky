'use strict'
const { exec } = require("child_process");

module.exports = {
  name: "embedded-app-backup",
  schedule: "16 1 * * *",
  handler: ({HEROKU_TOKEN} = process.env) => {
    exec(`HEROKU_API_KEY=${HEROKU_TOKEN} heroku pg:backups:capture --app embedded-membership-app`, (error, stdout, stderr) => {
      if (error) {
        console.log(`[embedded-app-backup] error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`[embedded-app-backup] stderr: ${stderr}`);
        return;
      }
      console.log(`[embedded-app-backup] stdout: ${stdout}`);
    });
  }
}
