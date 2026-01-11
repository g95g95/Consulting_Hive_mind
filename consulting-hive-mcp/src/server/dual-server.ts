import { startMCPServer } from './mcp/index.js';
import { startRESTServer } from './rest/index.js';

const mode = process.argv[2] || 'dual';
const restPort = parseInt(process.env.REST_PORT || '3101', 10);

async function main(): Promise<void> {
  console.log('Consulting Hive MCP Server');
  console.log('==========================');

  switch (mode) {
    case 'mcp':
      console.log('Starting MCP server only (stdio)...');
      await startMCPServer();
      break;

    case 'rest':
      console.log(`Starting REST server only on port ${restPort}...`);
      startRESTServer(restPort);
      break;

    case 'dual':
    default:
      console.log('Starting dual server mode...');
      console.log(`- REST API: http://localhost:${restPort}`);
      console.log('- MCP: Available via stdio when connected');

      startRESTServer(restPort);

      // MCP server can be started separately via:
      // node dist/server/mcp/index.js
      console.log('\nTo use MCP with Claude Desktop:');
      console.log('  node dist/server/mcp/index.js');
      break;
  }
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
