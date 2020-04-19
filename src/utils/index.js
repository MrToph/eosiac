const logs = require(`./log`)
const getConfig = require(`./get-config`)
const sleep = require(`./sleep`)
const asset = require(`./asset`)
const format = require(`./format`)

module.exports = {
    ...logs,
    ...asset,
    ...format,
    getConfig,
    sleep,
}
