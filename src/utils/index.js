const logs = require(`./log`)
const getConfig = require(`./get-config`)

module.exports = {
    ...logs,
    getConfig,
}
