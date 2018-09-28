const { withPgClient } = require("../helpers");
const { createPostGraphileSchema } = require("postgraphile-core");
const { readdirSync } = require("fs");
const { printSchema } = require("graphql/utilities");
const { readFile, executeGqlQueries } = require("./query-helpers");
const debug = require("debug")("graphile-build:schema");

const queriesDir = `${__dirname}/../fixtures/postgis-queries`;
const queryFileNames = readdirSync(queriesDir);
let queryResults = [];

const kitchenSinkData = () => {
  return readFile(`${__dirname}/../postgis-data.sql`, "utf8");
};

beforeAll(() => {
  // Get a few GraphQL schema instance that we can query.
  const gqlSchemasPromise = withPgClient(async pgClient => {
    // Different fixtures need different schemas with different configurations.
    // Make all of the different schemas with different configurations that we
    // need and wait for them to be created in parallel.
    const [normal] = await Promise.all([
      createPostGraphileSchema(pgClient, ["postgis"], {
        appendPlugins: [require("../../index.js")],
      }),
    ]);
    debug(printSchema(normal));
    return {
      normal,
    };
  });

  // Execute all of the queries in parallel. We will not wait for them to
  // resolve or reject. The tests will do that.
  //
  // All of our queries share a single client instance.
  const queryResultsPromise = (async () => {
    // Wait for the schema to resolve. We need the schema to be introspected
    // before we can do anything else!
    const gqlSchemas = await gqlSchemasPromise;
    // Get a new Postgres client instance.
    return withPgClient(async pgClient => {
      return await executeGqlQueries(
        pgClient,
        gqlSchemas,
        kitchenSinkData,
        queriesDir,
        queryFileNames,
        {}
      );
    });
  })();

  // Flatten out the query results promise.
  queryResults = queryFileNames.map(async (_, i) => {
    return await (await queryResultsPromise)[i];
  });
});

for (let i = 0; i < queryFileNames.length; i++) {
  test(queryFileNames[i], async () => {
    expect(await queryResults[i]).toMatchSnapshot();
  });
}
