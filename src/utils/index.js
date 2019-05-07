const logs = require(`./log`)
const getConfig = require(`./get-config`)
const sleep = require(`./sleep`)
const formats = require(`./formats`)

module.exports = {
    ...logs,
    ...formats,
    getConfig,
    sleep,
}
