const logs = require(`./log`)
const getConfig = require(`./get-config`)
const sleep = require(`./sleep`)

module.exports = {
    ...logs,
    getConfig,
    sleep,
}
