/**
 * utils/sqlHighlight.jsx
 * Tokenises a SQL string and returns a <span>-annotated React element
 * with amber keywords and cool-blue identifiers.
 */

const KEYWORDS = new Set([
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','FULL',
  'ON','AND','OR','NOT','IN','IS','NULL','AS','GROUP','BY','ORDER',
  'HAVING','LIMIT','OFFSET','DISTINCT','COUNT','SUM','AVG','MIN','MAX',
  'CASE','WHEN','THEN','ELSE','END','WITH','UNION','ALL','DATE_TRUNC',
  'INTERVAL','BETWEEN','LIKE','ILIKE','EXISTS','COALESCE','CAST','DESC','ASC',
]);

export function highlightSQL(sql) {
  // Split preserving whitespace and punctuation as tokens
  const tokens = sql.split(/(\s+|[,();*])/);
  return (
    <span>
      {tokens.map((tok, i) => {
        const upper = tok.trim().toUpperCase();
        if (!tok.trim()) return <span key={i}>{tok}</span>;
        if (KEYWORDS.has(upper))
          return <span key={i} className="sql-keyword">{tok}</span>;
        if (/^'[^']*'$/.test(tok))
          return <span key={i} className="sql-string">{tok}</span>;
        if (/^-?\d+(\.\d+)?$/.test(tok))
          return <span key={i} className="sql-number">{tok}</span>;
        if (/^[a-z_][a-z0-9_.]*$/i.test(tok))
          return <span key={i} className="sql-ident">{tok}</span>;
        return <span key={i}>{tok}</span>;
      })}
    </span>
  );
}
