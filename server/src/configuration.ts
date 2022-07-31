import fs from 'fs';
import path from 'path';
import { Metadata, config } from '@swagger-api/apidom-ls';

import { ApidomSettings } from './server-types';
import { functions } from './functions';
import { loadFunctions } from './utils';

/* function loadLinterFunctions(dir: string): LinterFunctions {
  const linterFunctions: LinterFunctions = {};
  // TODO (francesco.tumanischvili@smartbear.com)  Use async version
  const dirContent = fs.readdirSync(dir);

  dirContent.forEach((file) => {
    const funcName = file.split('.')[0];
    if (!file.endsWith('~')) {
      try {
        // TODO (francesco.tumanischvili@smartbear.com) sanitize
        // eslint-disable-next-line no-eval,no-param-reassign
        linterFunctions[funcName] = eval(fs.readFileSync(path.join(dir, String(file))).toString());
      } catch (e) {
        console.log('error eval', e);
      }
    }
  });

  return linterFunctions;
} */

// eslint-disable-next-line import/prefer-default-export
export function configuration(settings: ApidomSettings): Metadata {
  /* const linterFunctionsDirOpenApi = path.join(
    __dirname,
    'configuration',
    'default',
    'linter-functions-open-api',
  );
  const linterFunctionsDirAsyncApi = path.join(
    __dirname,
    'configuration',
    'default',
    'linter-functions-async-api',
  ); */

  const customConfig: Metadata = config();

  customConfig.rules = {
    openapi: {},
    asyncapi: {},
  };
  customConfig.linterFunctions = {
    openapi: { ...functions(), ...loadFunctions(path.join(__dirname, '..', 'src', 'functions')) },
  };
  if (settings.OpenApi?.rules && settings.OpenApi?.rules.length !== 0) {
    const rulesOpenApi = JSON.parse(fs.readFileSync(path.join(settings.OpenApi?.rules)).toString());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // customConfig.rules!.openapi!.lint!.push(...rulesOpenApi);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    customConfig.rules!['openapi'] = {
      lint: rulesOpenApi,
    };
  }
  if (settings.AsyncApi?.rules && settings.AsyncApi?.rules.length !== 0) {
    const rulesAsyncApi = JSON.parse(
      fs.readFileSync(path.join(settings.AsyncApi?.rules)).toString(),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    customConfig.rules!['asyncapi'] = {
      lint: rulesAsyncApi,
    };
  }

  /*
  if (settings.OpenApi?.linterFunctionDir && settings.OpenApi?.linterFunctionDir.length !== 0) {
    linterFunctionsDirOpenApi = path.join(settings.OpenApi?.linterFunctionDir);
  }
  if (settings.AsyncApi?.linterFunctionDir && settings.AsyncApi?.linterFunctionDir.length !== 0) {
    linterFunctionsDirAsyncApi = path.join(settings.AsyncApi?.linterFunctionDir);
  }
  customConfig.linterFunctions = {
    openapi: loadLinterFunctions(linterFunctionsDirOpenApi),
    asyncapi: loadLinterFunctions(linterFunctionsDirAsyncApi),
  };
*/

  return customConfig;
}
