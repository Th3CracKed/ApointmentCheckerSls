import type { AWS } from '@serverless/typescript';

import { checker } from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'serveless-scheduler',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    "serverless-offline-aws-eventbridge": {
      "port": 4010,
      "mockEventBridgeServer": true,
      "hostname": "127.0.0.1",
      "pubSubPort": 4011,
      "debug": false,
      "account": "",
      "maximumRetryAttempts": 0,
      "payloadSizeLimit": "10mb"
    }
  },
  plugins: ['serverless-webpack', 'serverless-offline', 'serverless-offline-aws-eventbridge'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      binaryMediaTypes: ['*/*'],
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      ACCOUNT_ID: '${opt:ACCOUNT_ID}'
    },
    lambdaHashingVersion: '20201221',
    timeout: 240,
    region: 'eu-west-3'
  },
  functions: { checker },
  package: {
    exclude: ['node_modules/puppeteer/.local-chromium/**']
  }
}

module.exports = serverlessConfiguration;
