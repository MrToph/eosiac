function sleep(delay) {
    return new Promise(resolve => setTimeout(resolve, delay))
}

module.exports = sleep
