/* eslint-disable no-console */
const chalk = require(`chalk`)

let verbose = false

function log(...args) {
    console.log(...args)
}

function info(...args) {
    console.log(chalk.blue(...args))
}

function warning(...args) {
    console.log(chalk.yellow(...args))
}

function error(...args) {
    console.log(chalk.red(...args))
}

function silent(...args) {
    if (verbose) {
        console.log(chalk.gray(...args))
    }
}

function setVerbose(_verbose) {
    verbose = _verbose
}

module.exports = {
    log,
    info,
    warning,
    error,
    silent,
    setVerbose,
    chalk,
}
