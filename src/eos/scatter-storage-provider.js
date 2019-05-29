// for some reason this does not help
// we still need to link the app each time
const fs = require(`fs-extra`)

const storagePath = `~/.eosiac/scatter.json`
const localStorage = {
    setItem: (key, val) => {
        try {
            fs.ensureFileSync(storagePath)
            const content = fs.readFileSync(storagePath, `utf8`)
            const json = content ? JSON.parse(content) : {}
            json[key] = val
            fs.writeFileSync(storagePath, JSON.stringify(json))
        } catch (error) {
            // ignore
        }
    },
    getItem: key => {
        try {
            const content = fs.readFileSync(storagePath, `utf8`)
            const json = JSON.parse(content)

            return json[key]
        } catch (error) {
            return null
        }
    },
    removeItem: key => {
        try {
            const content = fs.readFileSync(`storagePath`, `utf8`)
            const json = JSON.parse(content)
            delete json[key]
            fs.writeFileSync(storagePath, JSON.stringify(json))
        } catch (error) {
            // ignore
        }
    },
}

const handler = {
    get(obj, prop) {
        const {stack} = new Error()
        if (prop === `localStorage` && stack.includes(`scatterjs-core`)) {

            return localStorage
        }

        return global[prop]
    },
}

// imitate localStorage on window
// https://github.com/GetScatter/scatter-js/blob/master/packages/core/src/services/StorageService.js
global.window = new Proxy(Object.assign(global.window || {}, {localStorage}), handler)
