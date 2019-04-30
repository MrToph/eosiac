const chalk = require(`chalk`)

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

module.exports = {
    log,
    info,
    warning,
    error,
}
