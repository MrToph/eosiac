const ecc = require(`eosjs-ecc`)
const utils = require(`../../utils`)

async function keyToPublic(privateKeyWif) {
    const sk = ecc.PrivateKey.fromString(privateKeyWif)
    const pk = sk.toPublic().toString()
    utils.log(utils.chalk.blue(`Public key: ${pk}`))
}

module.exports = keyToPublic
