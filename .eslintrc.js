module.exports = {
    extends: ['eslint-config-with-prettier'],
    rules: {
        quotes: [2, 'backtick', {avoidEscape: true}],
        'no-restricted-syntax': 0
    },
}
