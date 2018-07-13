module.exports = function(controller, bot) {
  var port = process.env.PORT || 3000;

  controller.openSocketServer(port);
}
