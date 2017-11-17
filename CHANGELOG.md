# CHANGELOG

Categories: Removed, Changed, Added, Deprecated, Fixed, Security, Nonfunctional

## Unreleased

## 0.1.0 (2017-11-17)

### Changed
- PDEV-1935 - `DynamodbStorage` and `LambdaSnsExecutor` require `DynamoDB` and `SNS` clients to be injected respectively.
- PDEV-1951 - Replaced all occurences of `import`/`export` with CommonJS `require`/`module.exports`, so Flow is now compatible with Node.js.
