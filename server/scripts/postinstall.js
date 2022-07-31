'use strict';

const fs = require('fs');
const path =  require('path');


const replaceInJSONParserAdapter = () => {
  const pckgPath = path.join(__dirname, '..', 'node_modules', '@swagger-api', 'apidom-parser-adapter-json', 'package.json');
  const pckg = fs.readFileSync(pckgPath).toString();
  const pckgReplaced = pckg.replaceAll('adapter-node', 'adapter-browser');

  fs.writeFileSync(pckgPath, pckgReplaced);
};

const replaceInYAMLParserAdapter = () => {
  const pckgPath = path.join(__dirname, '..', 'node_modules', '@swagger-api', 'apidom-parser-adapter-yaml-1-2', 'package.json');
  const pckg = fs.readFileSync(pckgPath).toString();
  const pckgReplaced = pckg.replaceAll('adapter-node', 'adapter-browser');

  fs.writeFileSync(pckgPath, pckgReplaced);
};


replaceInJSONParserAdapter();
replaceInYAMLParserAdapter();
