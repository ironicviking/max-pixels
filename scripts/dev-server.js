#!/usr/bin/env node

import { createServer } from 'http-server';
import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
}

/**
 * Find the next available port starting from a given port
 */
async function findAvailablePort(startPort) {
    let port = startPort;
    while (port < startPort + 100) { // Try up to 100 ports
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    throw new Error(`No available port found in range ${startPort}-${startPort + 100}`);
}

/**
 * Start the development server
 */
async function startDevServer() {
    try {
        console.log('🚀 Starting Max-Pixels development server...');
        
        const preferredPort = process.env.PORT || 3000;
        const availablePort = await findAvailablePort(parseInt(preferredPort));
        
        if (availablePort !== parseInt(preferredPort)) {
            console.log(`⚠️  Port ${preferredPort} is in use, using port ${availablePort} instead`);
        }
        
        console.log(`🌐 Starting server on port ${availablePort}...`);
        
        // Use http-server with the available port
        const serverCommand = `npx http-server . -p ${availablePort} -o -c-1 --cors`;
        
        const child = exec(serverCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Server error:', error);
                return;
            }
            if (stderr) {
                console.error('Server stderr:', stderr);
            }
            console.log(stdout);
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down development server...');
            child.kill('SIGINT');
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down development server...');
            child.kill('SIGTERM');
            process.exit(0);
        });
        
        console.log(`✅ Max-Pixels development server will open at http://localhost:${availablePort}`);
        console.log('📝 Press Ctrl+C to stop the server');
        
    } catch (error) {
        console.error('❌ Failed to start development server:', error.message);
        process.exit(1);
    }
}

// Start the server if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startDevServer();
}

export { startDevServer, findAvailablePort };