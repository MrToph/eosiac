const isEqual = require(`lodash/isEqual`)
const sortBy = require(`lodash/sortBy`)

const parsePermission = p => {
    const match = p.match(
        /^(([a-z1-5.]{0,12}[a-j1-5]{0,1}@[a-z1-5.]+)|([\w]*)|(wait@[\d]+))\s*(\d*)?$/,
    )

    if (!match) {
        throw new Error(`Unknown permission specification "${p}" for account "${this.name}".`)
    }
    const [, spec, _, __, ___, weight] = match

    return {
        spec,
        weight: Number.parseInt(weight || 1, 10),
    }
}

const objComparer = obj => JSON.stringify(obj)
const arraysAreEqual = (arr1, arr2) => isEqual(sortBy(arr1, objComparer), sortBy(arr2, objComparer))
const permissionNeedsToBeUpdated = (desired, current) => {
    if (!current) {
        return true
    }

    const {required_auth: currentAuth} = current
    if (desired.parent !== current.parent || desired.threshold !== currentAuth.threshold) {
        return true
    }

    if (
        !arraysAreEqual(desired.keys, currentAuth.keys) ||
        !arraysAreEqual(desired.accounts, currentAuth.accounts) ||
        !arraysAreEqual(desired.waits, currentAuth.waits)
    ) {
        return true
    }

    return false
}

module.exports = {
    parsePermission,
    permissionNeedsToBeUpdated,
}
