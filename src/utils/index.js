const logs = require(`./log`)
const getConfig = require(`./get-config`)
const sleep = require(`./sleep`)
const asset = require(`./asset`)

module.exports = {
    ...logs,
    ...asset,
    getConfig,
    sleep,
}
