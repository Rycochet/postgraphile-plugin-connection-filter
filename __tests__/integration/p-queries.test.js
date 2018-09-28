const { withPgClient } = require("../helpers");
const { createPostGraphileSchema } = require("postgraphile-core");
const { readdirSync } = require("fs");
const { printSchema } = require("graphql/utilities");
const { readFile, executeGqlQueries } = require("./query-helpers");
const debug = require("debug")("graphile-build:schema");

const queriesDir = `${__dirname}/../fixtures/p-queries`;
const queryFileNames = readdirSync(queriesDir);
let queryResults = [];

const kitchenSinkData = () => readFile(`${__dirname}/../p-data.sql`, "utf8");

beforeAll(() => {
  // Get a few GraphQL schema instance that we can query.
  const gqlSchemasPromise = withPgClient(async pgClient => {
    // Different fixtures need different schemas with different configurations.
    // Make all of the different schemas with different configurations that we
    // need and wait for them to be created in parallel.
    const [normal, dynamicJson, simpleCollections] = await Promise.all([
      createPostGraphileSchema(pgClient, ["p"], {
        appendPlugins: [require("../../index.js")],
      }),
      createPostGraphileSchema(pgClient, ["p"], {
        dynamicJson: true,
        appendPlugins: [require("../../index.js")],
      }),
      createPostGraphileSchema(pgClient, ["p"], {
        simpleCollections: "only",
        appendPlugins: [require("../../index.js")],
      }),
    ]);
    debug(printSchema(normal));
    return {
      normal,
      dynamicJson,
      simpleCollections,
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

    // Get the appropriate GraphQL schema for this fixture. We want to test
    // some specific fixtures against a schema configured slightly
    // differently.
    const queryFileToGqlSchemaMap = {
      "connections-filter.dynamic-json.graphql": gqlSchemas.dynamicJson,
      "connections-filter.simple-collections.graphql":
        gqlSchemas.simpleCollections,
    };

    // Get a new Postgres client instance.
    return withPgClient(async pgClient => {
      return await executeGqlQueries(
        pgClient,
        gqlSchemas,
        kitchenSinkData,
        queriesDir,
        queryFileNames,
        queryFileToGqlSchemaMap
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
