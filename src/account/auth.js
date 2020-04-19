const flattenDeep = require(`lodash/flattenDeep`)
const isEqual = require(`lodash/isEqual`)
const sortBy = require(`lodash/sortBy`)
const utils = require(`../utils`)

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

const createUnlinkActions = ({existingLinks, desiredLinks, account}) => {
    // unlink all permissions in existingLinks but not in desiredLinks
    const linksToRemove = existingLinks.filter(
        link1 =>
            !desiredLinks.some(
                link2 => link1.contract === link2.contract && link1.action === link2.action,
            ),
    )

    return linksToRemove.map(link => ({
        account: `eosio`,
        name: `unlinkauth`,
        data: {
            account: account.name,
            code: link.contract,
            type: link.action,
        },
    }))
}

const createLinkActions = ({existingLinks, desiredLinks, account, permName}) => {
    // link all permissions in desiredLinks but not in existingLinks
    const linksToAdd = desiredLinks.filter(
        link1 =>
            !existingLinks.some(
                link2 => link1.contract === link2.contract && link1.action === link2.action,
            ),
    )

    return linksToAdd.map(link => ({
        account: `eosio`,
        name: `linkauth`,
        data: {
            account: account.name,
            code: link.contract,
            type: link.action,
            requirement: permName,
        },
    }))
}

const getLinkAuthActions = ({account, env}) => {
    // is set when dfuse was not initialized
    if (account.currentState.linkedPermissions instanceof Error) {
        return []
    }

    // eslint-disable-next-line no-underscore-dangle
    const auth = account._getAuthFromConfig()

    const allActions = Object.keys(auth).map(permName => {
        const permission = auth[permName]
        const existingLinks = Array.isArray(account.currentState.linkedPermissions)
            ? account.currentState.linkedPermissions.filter(
                  linkedPerm => linkedPerm.permission_name === permName,
              )
            : []
        const desiredLinks = (permission.links || []).map(link => {
            const [contract, action] = link.split(`@`)

            return {
                contract,
                action,
            }
        })

        const unlinkActions = createUnlinkActions({existingLinks, desiredLinks, account})
        const linkActions = createLinkActions({existingLinks, desiredLinks, account, permName})

        const actions = unlinkActions.concat(linkActions)

        // add authorization
        return actions.map(action =>
            Object.assign(
                {
                    authorization: [
                        {
                            actor: account.name,
                            permission: auth[permName].parent || `owner`, // owner permission has parent ''
                        },
                    ],
                },
                action,
            ),
        )
    })

    return flattenDeep(allActions)
}

const getAuthActions = ({account, env}) => {
    // eslint-disable-next-line no-underscore-dangle
    const auth = account._getAuthFromConfig()

    const permNamesToUpdate = Object.keys(auth)
        .map(permName => {
            if (
                permissionNeedsToBeUpdated(
                    auth[permName],
                    account.currentState.permissions.find(p => p.perm_name === permName),
                )
            ) {
                return permName
            }

            return null
        })
        .filter(Boolean)

    const requiresUpdate = permNamesToUpdate.length > 0
    if (!requiresUpdate) {
        utils.silent(`Account "${account.name}"'s permissions are up-to-date.`)
    } else {
        utils.silent(
            `Account "${account.name}"'s permissions (${permNamesToUpdate.join(
                ` `,
            )}) need to be updated.`,
        )
    }

    const updateAuthActions = permNamesToUpdate.map(permName => ({
        account: `eosio`,
        name: `updateauth`,
        authorization: [
            {
                actor: account.name,
                permission: auth[permName].parent || `owner`, // owner permission has parent ''
            },
        ],
        data: {
            account: account.name,
            permission: permName,
            parent: auth[permName].parent,
            auth: auth[permName],
        },
    }))

    const linkAuthActions = getLinkAuthActions({env, account})

    return updateAuthActions.concat(linkAuthActions)
}

module.exports = {
    getAuthActions,
    parsePermission,
}
