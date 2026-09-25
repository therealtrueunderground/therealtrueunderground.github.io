/** Remove only empty outer rows and columns; keep every space inside the drawing. */
export function cropAsciiMargins(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let top = lines.length;
  let bottom = -1;
  let left = Infinity;
  let right = -1;

  lines.forEach((line, row) => {
    const first = line.search(/[^ ]/);
    if (first === -1) return;
    top = Math.min(top, row);
    bottom = row;
    left = Math.min(left, first);
    for (let column = line.length - 1; column >= first; column--) {
      if (line[column] !== " ") {
        right = Math.max(right, column);
        break;
      }
    }
  });

  if (bottom === -1) return "";
  return lines.slice(top, bottom + 1).map((line) => line.slice(left, right + 1)).join("\n");
}
