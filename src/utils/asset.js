function formatAsset({amount, symbol: {symbol, precision}}) {
    let s = String(amount)
    while (s.length < precision + 1) {
        s = `0${s}`
    }

    const pre = s.slice(0, -precision)
    const end = s.slice(-precision)

    return `${pre}.${end} ${symbol}`
}

function decomposeAsset(assetString) {
    try {
        const [amountWithPrecision, symbolName] = assetString.split(` `)
        if (!amountWithPrecision || !symbolName) {
            throw new Error(`Invalid split`)
        }
        const amountNoPrecision = Number.parseInt(amountWithPrecision.replace(`.`, ``), 10)

        const dotIndex = amountWithPrecision.indexOf(`.`)
        if (dotIndex === -1) {
            throw new Error(`No dot found`)
        }
        const precision = amountWithPrecision.length - dotIndex - 1

        return {
            amount: amountNoPrecision,
            symbol: {
                precision,
                symbol: symbolName,
            },
        }
    } catch (error) {
        throw new Error(
            `Invalid asset passed to decomposeAsset: ${JSON.stringify(assetString)}. ${
                error.message
            }${error.stack}`,
        )
    }
}

module.exports = {
    formatAsset,
    decomposeAsset,
}
