module.exports = function PgConnectionArgFilterPostgisOperatorsPlugin(builder) {
  builder.hook("init", (_, build) => {
    const {
      addConnectionFilterOperator,
      pgSql: sql,
      graphql: { GraphQLBoolean },
    } = build;
    addConnectionFilterOperator(
      "overlapsBB",
      "Returns TRUE if A's 2D bounding box intersects B's 2D bounding box.",
      () => GraphQLBoolean,
      (identifier, val) => {
        return sql.query`${identifier} && ${val}`;
      },
      {
        resolveWithRawInput: true,
        allowedListTypes: ["NonList", "List"],
      }
    );
    return _;
  });
};
