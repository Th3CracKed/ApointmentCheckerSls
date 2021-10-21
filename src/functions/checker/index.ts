import type { AWS } from '@serverless/typescript';

let skeleton: AWS;

type Function = typeof skeleton.functions.anything

const checkerFn: Function = {
  handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
  maximumRetryAttempts: 0,
  events: [
    {
      http: {
        method: 'get',
        path: 'checker'
      },
      eventBridge: {
        schedule: "rate(15 minutes)"
      }
    }
  ],
}
export default checkerFn;