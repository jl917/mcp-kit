import { runCli, handleCliError } from '@common';
import { tools } from './tools/index.js';

runCli(tools).catch(handleCliError);
