module.exports = function PgConnectionArgFilterPostgisOperatorsPlugin(builder) {
  builder.hook("init", (_, build) => {
    const { addConnectionFilterOperator, pgSql: sql } = build;
    addConnectionFilterOperator(
      "overlapsBB",
      "Returns TRUE if A's 2D bounding box intersects B's 2D bounding box.",
      fieldType => fieldType,
      (identifier, val) => {
        return sql.query`${identifier} && ${val}::geometry`;
      },
      {
        allowedFieldTypes: ["Geometry", "Geography", "String"],
        allowedListTypes: ["NonList", "List"],
      }
    );
    return _;
  });
};
