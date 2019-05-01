const path = require(`path`)
const fs = require(`fs`)
const yaml = require(`js-yaml`)

const log = require(`./log`)
const schema = require(`../schema`)
const Joi = require(`@hapi/joi`)

function getConfig(_configPath) {
    let configPath = _configPath
    if (!configPath) {
        // handle special .yaml extension
        configPath = `eosiac.yaml`
        if (!fs.existsSync(configPath)) {
            configPath = `eosiac.yml`
        }
    }

    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file "${path.resolve(configPath)}" does not exist.`)
    }

    let configContent = ``
    try {
        configContent = fs.readFileSync(configPath, {encoding: `utf8`})
    } catch (error) {
        throw new Error(`Cannot read config "${path.resolve(configPath)}":\n  ${error.message}`)
    }

    let config = null
    try {
        config = yaml.safeLoad(configContent, {
            onWarning(error) {
                log.warning(`Warning: ${error}`)
            },
        })
    } catch (error) {
        throw new Error(
            `Error while parsing config "${path.resolve(configPath)}":\n  ${error.message}`,
        )
    }

    const result = Joi.validate(config, schema)
    if (result.error) {
        throw new Error(
            `Error while validating config "${path.resolve(configPath)}":\n  ${result.error}`,
        )
    }

    log.silent(`Loaded config "${configPath}".`)

    return {config, configPath: path.resolve(configPath)}
}

module.exports = getConfig
