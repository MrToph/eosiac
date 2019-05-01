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

// show help on unknown commands
program.on(`command:*`, () => {
    utils.log(program.help())
})

function cli(argv) {
    program.parse(argv)
}

module.exports = cli
