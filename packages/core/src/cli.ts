import { runCli, handleCliError } from '@common';
import { tools } from './tools/system.js';

runCli(tools).catch(handleCliError);
