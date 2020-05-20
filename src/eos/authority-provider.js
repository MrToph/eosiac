const { convertLegacyPublicKeys } = require(`eosjs/dist/eosjs-numeric`)

class AuthorityProvider {
    constructor(rpc) {
        this.rpc = rpc
    }

    /** Get subset of `availableKeys` needed to meet authorities in `transaction`. Implements `AuthorityProvider` */
    async getRequiredKeys(args) {
        // console.log(`getRequiredKeys`, JSON.stringify(args, null, 2))
        // console.log(`convertLegacyPublicKeys`, convertLegacyPublicKeys(args.availableKeys))

        return this.rpc.getRequiredKeys(args)
    }
}

module.exports = AuthorityProvider
