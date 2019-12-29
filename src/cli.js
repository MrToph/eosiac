const program = require(`commander`)
const utils = require(`./utils`)
const commands = require(`./commands`)
const packageJson = require(`../package.json`)

program.version(packageJson.version)

program
    .command(`apply <env>`)
    .description(`run setup transactions for specified environment`)
    .option(`-c, --config <path>`, `config file to use`)
    .option(`-v, --verbose`, `verbose output log`)
    .action(async (env, options) => {
        try {
            utils.setVerbose(options.verbose)
            await commands.apply(env, options)
            // even with cleanup Scatter's socket service does not close immediately
            process.exit(0)
        } catch (error) {
            utils.error(error.message)
            process.exit(1)
        }
    })
    .on(`--help`, () => {
        utils.log(``)
        utils.log(`Examples:`)
        utils.log(``)
        utils.log(`  $ eosiac apply dev`)
        utils.log(`  $ eosiac apply mainnet --config 'configs/eos_config.yml'`)
    })

program
    .command(`create-actions <env> <account>`)
    .description(
        `bootstraps javascript actions files for the contract specified in the config by account in env`,
    )
    .option(`-c, --config <path>`, `config file to use`)
    .option(`-v, --verbose`, `verbose output log`)
    .action(async (env, account, options) => {
        try {
            utils.setVerbose(options.verbose)
            await commands.createActions(env, account, options)
        } catch (error) {
            utils.error(error.message)
            process.exit(1)
        }
    })
    .on(`--help`, () => {
        utils.log(`The "abi" field must exist for the specified account in the environment.`)
        utils.log(`Examples:`)
        utils.log(``)
        utils.log(`  $ eosiac create-actions dev cryptoshipxx`)
        utils.log(`  $ eosiac create-actions dev cryptoshipxx --config 'configs/eos_config.yml'`)
    })

program
    .command(`create-keys <regex>`)
    .description(`creates vanity EOSIO public keys`)
    .option(`-r, --regex <path>`, `regex to look for in an EOSIO public key`)
    .action(async (regex, options) => {
        try {
            utils.setVerbose(options.verbose)
            await commands.createKeys(regex, options)
        } catch (error) {
            utils.error(error.message)
            process.exit(1)
        }
    })
    .on(`--help`, () => {
        utils.log(`Examples:`)
        utils.log(``)
        utils.log(`  $ eosiac create-keys /^EOS.{1}CPU/i`)
    })

program
    .command(`key-to-public <privateKey>`)
    .description(`shows the corresponding public key to a private key`)
    .action(async privateKey => {
        try {
            await commands.keyToPublic(privateKey)
        } catch (error) {
            utils.error(error.message)
            process.exit(1)
        }
    })
    .on(`--help`, () => {
        utils.log(`Examples:`)
        utils.log(``)
        utils.log(`  $ eosiac key-to-public 5JthD64TpfEV9925zSGtBCtHj67bMVXiFMhsXxZ2tKwFuTHs2VD`)
    })

// show help on unknown commands
program.on(`command:*`, () => {
    utils.log(program.help())
})

function cli(argv) {
    program.parse(argv)
}

module.exports = cli
