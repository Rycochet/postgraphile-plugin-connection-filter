const { graphql } = require("graphql");
const { readFile: readRawFile } = require("fs");
const { resolve: resolvePath } = require("path");

function readFile(filename, encoding) {
  return new Promise((resolve, reject) => {
    readRawFile(filename, encoding, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

/**
 * @param pgClient
 * @param gqlSchemas
 * @param kitchenSinkDataFn, e.g. () => readFile('file-containing-insert-statements.sql', 'utf8')
 * @param queriesDir
 * @param queryFileNames, e.g. ["connections-filter.dynamic-json.graphql"]
 * @param queryFileToGqlSchemaMap, e.g. {"connections-filter.dynamic-json.graphql": yourSchema}
 */
async function executeGqlQueries(
  pgClient,
  gqlSchemas,
  kitchenSinkDataFn,
  queriesDir,
  queryFileNames,
  queryFileToGqlSchemaMap
) {
  // Add data to the client instance we are using.
  await pgClient.query(await kitchenSinkDataFn());
  // Run all of our queries in parallel.
  return await Promise.all(
    queryFileNames.map(async fileName => {
      // Read the query from the file system.
      const query = await readFile(resolvePath(queriesDir, fileName), "utf8");
      const gqlSchema = queryFileToGqlSchemaMap[fileName] || gqlSchemas.normal;
      // Return the result of our GraphQL query.
      const result = await graphql(gqlSchema, query, null, {
        pgClient: pgClient,
      });
      if (result.errors) {
        console.log(result.errors.map(e => e.originalError));
      }
      return result;
    })
  );
}

exports.readFile = readFile;
exports.executeGqlQueries = executeGqlQueries;