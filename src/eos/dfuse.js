const {createDfuseClient} = require(`@dfuse/client`)
const fetch = require(`node-fetch`) // node only; not needed in browsers
const utils = require(`../utils`) // node only; not needed in browsers

const DFUSE_API_KEY = `mobile_bc76d1df5741aec7be45734bdb450597`

const getNetworkFromEnv = env => {
    switch (env.chain_id) {
        case `e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473`:
            return `jungle`
        case `5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191`:
            return `kylin`
        case `aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906`:
            return `mainnet`
        default:
            return null
    }
}

function initDfuse(env) {
    const apiNetwork = getNetworkFromEnv(env)

    let client = null
    if (apiNetwork) {
        client = createDfuseClient({
            apiKey: DFUSE_API_KEY,
            network: apiNetwork,
            httpClientOptions: {
                fetch,
            },
            streamClientOptions: {
                socketOptions: {
                    webSocketFactory: async () => null,
                },
            },
        })
    } else {
        utils.silent(`dfuse not initialized for chainId ${env.chain_id}`)
    }

    return client
}

module.exports = initDfuse
