function formatAsset({amount, symbol, precision}) {
    let s = String(amount)
    while (s.length < precision + 1) {
        s = `0${s}`
    }

    const pre = s.slice(0, -precision)
    const end = s.slice(-precision)

    return `${pre}.${end} ${symbol}`
}

module.exports = {
    formatAsset,
}
