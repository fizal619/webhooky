module.exports = {
  name: "example",
  path: "/example",
  method: "get",
  handler: (req, res) => {
    res.send("EXAMPLE ROUTE WORKS");
  }
}