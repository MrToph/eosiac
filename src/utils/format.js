function arrayToHex(data) {
    let result = ``
    for (const x of data) {
        result += `00${x.toString(16)}`.slice(-2)
    }

    return result
}

module.exports = {
    arrayToHex,
}
