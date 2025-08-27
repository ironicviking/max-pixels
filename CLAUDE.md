# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Max-Pixels is a web-based multiplayer space exploration and trading game built entirely with code-generated graphics. The game features:

- **Technology Stack**: Web-based with SVG graphics generated in-browser or pre-generated
- **Architecture**: No game engines (Unity, etc.) - pure web technologies
- **Multiplayer**: Built multiplayer-first with authentication and friend systems
- **Content Strategy**: Continuously expanding world with weekly area/level additions
- **Theme**: Space exploration and trading mechanics

## Development Approach

### Graphics & Rendering
- All graphics must be SVG-based, either generated dynamically in browser or pre-generated
- No external game engines or frameworks
- Focus on procedural/algorithmic graphics generation

### Multiplayer Architecture
- Design all systems with multiplayer in mind from the start
- Implement robust authentication system
- Build friend list and social features
- Plan for real-time synchronization of game state

### Content Expansion
- Design modular systems that support easy addition of new areas/levels
- Plan for weekly content releases
- Build tools for content creation and deployment

## Development Commands

The project now has proper development tooling configured:

### Daily Development
- `npm run dev` - Start development server on port 3000 with auto-reload
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues where possible

### Production Build
- `npm run build` - Build production-ready assets in `dist/` folder
- `npm run serve:prod` - Build and serve production version on port 8080
- `npm run clean` - Remove build artifacts

### Code Quality
- ESLint configured for ES2022 modules with game development best practices
- Build process includes JavaScript minification (50%+ size reduction)
- Production HTML optimized with meta tags and SEO enhancements

### Testing
- `npm run test` - Placeholder for future browser-based game testing framework

## Code Structure

The project is in early stages. Key structural considerations:
- Separate client/server architecture for multiplayer
- Modular systems for space exploration mechanics
- Trading system implementation
- User authentication and social features
- SVG graphics generation utilities

## Current State

This is a new project with only initial documentation. The codebase structure and implementation details will be established during development.