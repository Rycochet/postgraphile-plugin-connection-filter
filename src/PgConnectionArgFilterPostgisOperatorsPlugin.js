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
    addConnectionFilterOperator(
      "disjointsG",
      "Returns TRUE if the Geometries do not 'spatially intersect' - if they do not share any space together.",
      fieldType => fieldType,
      (identifier, val) => {
        return sql.query`ST_Disjoint(${identifier}, ${val}::geometry)`;
      },
      {
        allowedFieldTypes: ["Geometry", "Geography", "String"],
        allowedListTypes: ["NonList", "List"],
      }
    );
    addConnectionFilterOperator(
      "intersectsG",
      "Returns TRUE if the Geometries/Geography 'spatially intersect in 2D' - (share any portion of space).",
      fieldType => fieldType,
      (identifier, val) => {
        return sql.query`ST_Intersects(${identifier}, ${val}::geometry)`;
      },
      {
        allowedFieldTypes: ["Geometry", "Geography", "String"],
        allowedListTypes: ["NonList", "List"],
      }
    );
    return _;
  });
};
