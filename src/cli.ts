import { runCli, handleCliError } from '@/common';
import { tools } from '@/tools/index';

runCli(tools).catch(handleCliError);
