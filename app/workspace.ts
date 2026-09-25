/** Reorder an open file relative to another without changing the supplied array. */
export function moveTab(
  tabs: string[],
  path: string,
  targetPath: string,
  placement: "before" | "after" = "after",
): string[] {
  if (path === targetPath || !tabs.includes(path) || !tabs.includes(targetPath)) return tabs;
  const next = tabs.filter((tab) => tab !== path);
  const targetIndex = next.indexOf(targetPath);
  next.splice(targetIndex + (placement === "after" ? 1 : 0), 0, path);
  return next;
}
