import chalk from 'chalk';
import pkg from 'lodash';
const { chunk } = pkg;

// Its not equivalent to the C# throttler. With some work it could be though.
export default async function RunThrottled<T, K>(items: T[], maxParallelism: number, asyncAction: (x: T)=> Promise<K>): Promise<K[]>  {
    let results = [];

    const batches = chunk(items, maxParallelism) as T[][];
    for (let batch of batches) {
        try {
            const batchResults = await Promise.all(batch.map(asyncAction));
            results = results.concat(batchResults);
        } catch (err) {
            console.log(chalk.red("\nUnexpected error from OrderCloud. This is likely a seeding tool bug. Please create a github issue with your seed file included! https://github.com/ordercloud-api/ordercloud-seed/issues.\n"));
            console.log("Request method:", chalk.green(err.response.config.method.toUpperCase()));
            console.log("Request url:", chalk.green(err.response.config.url));
            console.log("Request data:", chalk.green(err.response.config.data));
            console.log("\nResponse status:", err.status);
            console.log("Response data:", err.errors.Errors[0]);

            throw err;
        }
    }
  
    return results;
}