#!/usr/bin/env node

/**
 * Build script for Max-Pixels game
 * Minifies JavaScript and creates production-ready assets
 */

import fs from 'fs/promises';
import path from 'path';
import { minify } from 'terser';

const BUILD_DIR = 'dist';
const SRC_DIR = 'src';

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function minifyFile(inputPath, outputPath) {
    console.log(`Minifying ${inputPath} → ${outputPath}`);
    
    const code = await fs.readFile(inputPath, 'utf-8');
    const result = await minify(code, {
        module: true,
        compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
            pure_funcs: ['console.debug']
        },
        mangle: {
            keep_classnames: true, // Keep class names for debugging
            keep_fnames: true
        },
        format: {
            comments: false
        }
    });

    if (result.error) {
        throw new Error(`Error minifying ${inputPath}: ${result.error}`);
    }

    await fs.writeFile(outputPath, result.code);
    
    // Report size reduction
    const originalSize = Buffer.byteLength(code, 'utf-8');
    const minifiedSize = Buffer.byteLength(result.code, 'utf-8');
    const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    console.log(`  Size: ${originalSize} → ${minifiedSize} bytes (${reduction}% reduction)`);
}

async function copyFile(src, dest) {
    console.log(`Copying ${src} → ${dest}`);
    await fs.copyFile(src, dest);
}

async function processDirectory(srcDir, buildDir) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const buildPath = path.join(buildDir, entry.name);
        
        if (entry.isDirectory()) {
            await ensureDir(buildPath);
            await processDirectory(srcPath, buildPath);
        } else if (entry.name.endsWith('.js')) {
            await minifyFile(srcPath, buildPath);
        }
    }
}

async function build() {
    console.log('🚀 Building Max-Pixels for production...\n');
    
    try {
        // Clean build directory
        console.log('Cleaning build directory...');
        await fs.rm(BUILD_DIR, { recursive: true, force: true });
        await ensureDir(BUILD_DIR);
        
        // Process JavaScript files
        console.log('\nMinifying JavaScript files...');
        await ensureDir(path.join(BUILD_DIR, SRC_DIR));
        await processDirectory(SRC_DIR, path.join(BUILD_DIR, SRC_DIR));
        
        // Copy static assets
        console.log('\nCopying static assets...');
        await copyFile('index.html', path.join(BUILD_DIR, 'index.html'));
        await copyFile('package.json', path.join(BUILD_DIR, 'package.json'));
        
        // Create production HTML with minified references
        console.log('\nOptimizing HTML for production...');
        let html = await fs.readFile('index.html', 'utf-8');
        
        // Add production meta tags and optimizations
        html = html.replace(
            '<title>Max-Pixels - Space Exploration Trading Game</title>',
            `<title>Max-Pixels - Space Exploration Trading Game</title>
    <meta name="description" content="Web-based multiplayer space exploration and trading game">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="Max-Pixels - Space Trading Game">
    <meta property="og:description" content="Explore space, trade resources, and build your empire in this multiplayer web game">
    <meta property="og:type" content="game">`
        );
        
        await fs.writeFile(path.join(BUILD_DIR, 'index.html'), html);
        
        console.log('\n✅ Build completed successfully!');
        console.log(`📦 Production files available in: ${BUILD_DIR}/`);
        console.log('🌐 Deploy the dist/ folder to your web server');
        
    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

build();