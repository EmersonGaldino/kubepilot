/** Turns a `matchLabels`-style map (as returned on `DeploymentDetail.selector`,
 * `StatefulSetDetail.selector`, etc.) into a Kubernetes label selector string
 * usable with `pods.list(namespace, labelSelector)`, e.g. `{ app: "foo" }` →
 * `"app=foo"`. Returns `null` for an empty map — matching every pod in the
 * namespace would be misleading for a workload whose selector we don't know. */
export function toLabelSelector(selector: Record<string, string>): string | null {
  const entries = Object.entries(selector)
  if (entries.length === 0) return null
  return entries.map(([key, value]) => `${key}=${value}`).join(',')
}
