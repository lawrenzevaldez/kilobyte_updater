'use strict'

const WooCommerceApiController = require("../Controllers/Http/WooCommerceApiController")

const Task = use('Task')

class SendToApi extends Task {
  static get schedule () {
    // return '0 */55 * * * *'
  }

  async handle () {
    try {
      // console.log("START SENDING TO API")
      // let Controller = new WooCommerceApiController
      // await Controller.sendtoapi()
      // console.log("---END---")
    } catch(e) {
      // console.log(e)
    }
  }
}

module.exports = SendToApi
