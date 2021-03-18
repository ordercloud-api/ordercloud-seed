import pkg from 'lodash';
const { chunk } = pkg;

// Its not equivalent to the C# throttler. With some work it could be though.
export default async function RunThrottled<T, K>(items: T[], maxParallelism: number, asyncAction: (x: T)=> Promise<K>): Promise<K[]>  {
    let results = [];

    const batches = chunk(items, maxParallelism) as T[][];
    for (let batch of batches) {
        const batchResults = await Promise.all(batch.map(asyncAction));
        results = results.concat(batchResults);
    }
  
    return results;
}