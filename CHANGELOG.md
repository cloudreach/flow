# CHANGELOG

Categories: Removed, Changed, Added, Deprecated, Fixed, Security, Nonfunctional

## Unreleased

### Changed
- PDEV-1935 - `DynamodbStorage` and `LambdaSnsExecutor` require `DynamoDB` and `SNS` clients to be injected respectively.
- PDEV-1951 - Replaced all occurences of `import`/`export` with CommonJS `require`/`module.exports`, so Flow is now compatible with Node.js.
