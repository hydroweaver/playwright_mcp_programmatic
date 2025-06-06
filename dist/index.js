import express from 'express';
import { randomUUID } from 'node:crypto';
import { createConnection } from '@playwright/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
const app = express();
app.use(express.json());
app.post('/mcp', async (req, res) => {
    const server = await createConnection({ browser: { launchOptions: { headless: true } } });
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: randomUUID,
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
            console.log('Request closed');
            transport.close();
            server.close();
        });
    }
    catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});
// Handle server shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    process.exit(0);
});
// http.createServer(async (req, res) => {
//   // ...
//   // Creates a headless Playwright MCP server with SSE transport
//   const connection = await createConnection({ browser: { launchOptions: { headless: true } } });
//   const transport = new StreamableHTTPServerTransport({
//     sessionIdGenerator: () => randomUUID()
//   });
// console.log('connection:', connection);
// console.log('methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(connection)));
// //   await connection.connect(transport)
//   // ...
// }).listen(8931, ()=>{
//     console.log('...running....')
// });
