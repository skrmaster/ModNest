export function splitBatch<T>(arr: T[], batchSize = 400): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += batchSize) {
    result.push(arr.slice(i, i + batchSize))
  }
  return result
}
