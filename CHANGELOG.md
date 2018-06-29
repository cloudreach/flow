# CHANGELOG

Categories: Removed, Changed, Added, Deprecated, Fixed, Security, Nonfunctional

## Unreleased

## 0.1.4

### Fixed

- PDEV-2694 - Fix loading dependency tasks when DynamoDB response has multiple pages.

## 0.1.3

### Fixed

- PDEV-2656 - Fix loading more than 100 dependency tasks from DynamoDB storage.

## 0.1.2 (2018-06-15)

### Fixed

- PDEV-2664 - Return an empty array if no dependencies to load.

## 0.1.1 (2017-12-12)

### Fixed

- PDEV-1969 - Fix inserting more than 25 tasks into DynamoDB storage.

## 0.1.0 (2017-11-17)

### Changed

- PDEV-1935 - `DynamodbStorage` and `LambdaSnsExecutor` require `DynamoDB` and `SNS` clients to be injected respectively.
- PDEV-1951 - Replaced all occurences of `import`/`export` with CommonJS `require`/`module.exports`, so Flow is now compatible with Node.js.
