function getSystemToken(env) {
    const systemContract = env.system_contract || `eosio.token`
    const [precision, symbolCode] = (env.system_symbol || `4,EOS`).split(`,`)
    if (!symbolCode) {
        throw new Error(`system_symbol must be in 'precision,symbolCode' (4,EOS) format`)
    }

    return {
        contract: systemContract,
        symbol: {
            symbol: symbolCode,
            precision: Number.parseInt(precision, 10),
        },
    }
}

module.exports = {
    getSystemToken,
}
