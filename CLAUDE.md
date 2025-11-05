# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **react-native-css**, a CSS polyfill for React Native that brings comprehensive CSS support including media queries, container queries, CSS variables, animations, and more. The library compiles CSS at build-time using lightningcss and provides a runtime that interprets the compiled styles.

## Development Commands

### Setup and Building
- `yarn init -2` - Initialize Yarn 4 (required)
- `yarn clean` - Full clean install: removes node_modules, installs deps, builds project and example app
- `yarn build` - Build the library using react-native-builder-bob
- `yarn typecheck` - Run TypeScript type checking
- `yarn lint` - Run ESLint
- `yarn lint --fix` - Auto-fix linting issues

### Testing
- `yarn test` - Run all Jest tests
- `yarn test babel` - Run only Babel plugin tests
- `yarn test compiler` - Run only compiler tests
- `yarn test native` - Run only native runtime tests

### Example App
- `yarn example start` - Start Expo CLI for the example app
- `yarn example start:build` - Rebuild library + start Expo CLI (clears cache)
- `yarn example start:debug` - Rebuild + start with debug logging enabled
- `yarn example ios` - Run example on iOS
- `yarn example android` - Run example on Android
- `yarn example expo prebuild` - Rebuild the example app native code

### Shortcuts
- `yarn start` - Alias for `yarn example start`
- `yarn start:build` - Alias for building + starting example
- `yarn start:debug` - Alias for building + starting with debug logs

## Architecture

### High-Level Flow

1. **CSS File** → **Compiler** → **Compiled JSON** → **Metro Transform** → **Babel Transform** → **Runtime**

The library consists of several interconnected systems:

### 1. Compiler (`src/compiler/`)

The core CSS-to-JSON compiler that converts CSS into optimized style objects.

- **Entry**: `compiler.ts` - Main `compile()` function
- **CSS Parsing**: Uses lightningcss library to parse and transform CSS AST
- **Two-Pass System**: Runs lightningcss twice to properly handle calc() simplification
- **Key Files**:
  - `declarations.ts` - Converts CSS declarations to React Native style properties
  - `selectors.ts` - Parses and processes CSS selectors
  - `selector-builder.ts` - Builds selector specificity and conditions
  - `media-query.ts` - Parses media queries into runtime conditions
  - `container-query.ts` - Parses container queries
  - `keyframes.ts` - Extracts CSS animations
  - `inline-variables.ts` - Optimizes CSS variables that only have one value
  - `stylesheet.ts` - StylesheetBuilder class that manages compilation state

**Optimizations**:
- **Inline REM**: Converts rem units to px at build-time (default 14px, configurable)
- **Inline Variables**: CSS variables set only once are inlined and removed

**Output**: `ReactNativeCssStyleSheet` - A JSON structure with:
- `s` - StyleRuleSets (selector → style rules mapping)
- `k` - KeyFrames (animations)
- `vr` - Root variables
- `vu` - Universal variables
- `f` - Feature flags
- `r` - REM value

### 2. Metro Integration (`src/metro/`)

Metro bundler plugin that transforms CSS files during the build process.

- **Entry**: `index.ts` - `withReactNativeCSS()` function wraps Metro config
- **Transformer**: `metro-transformer.ts` - Transforms CSS files to JS modules
- **Resolver**: `resolver.ts` - Custom resolution for native/web platforms
- **TypeScript**: `typescript.ts` - Generates `types-env.d.ts` for CSS module types
- **Override**: `override.ts` - Handles `globalClassNamePolyfill` feature

**Key Options**:
- `globalClassNamePolyfill` - Adds className support to all RN components
- `inlineRem` - Configure rem-to-px conversion
- `inlineVariables` - Configure variable inlining

### 3. Babel Plugin (`src/babel/`)

Babel transforms for processing JSX and imports.

- `import-plugin.ts` - Handles CSS imports and injection
- `react-native.ts` - Transforms React Native imports for className polyfill
- `react-native-web.ts` - Transforms for web platform

**Note**: Changes to Babel plugin require rebuilding the library and clearing Metro cache.

### 4. Native Runtime (`src/native/`)

The React Native runtime that interprets compiled styles and renders components.

- **Entry**: `api.tsx` - Public API (`styled`, `useCssElement`, etc.)
- **Core Files**:
  - `react/useNativeCss.ts` - Main hook for applying CSS to components
  - `reactivity.ts` - Reactive system for dynamic styles
  - `objects.ts` - Style object creation and management
  - `styles/` - Style resolution and processing
    - `resolve.ts` - Main style resolution logic
    - `calculate-props.ts` - Calculates final props from styles
    - `variables.ts` - CSS variable resolution
    - `units.ts` - Unit conversion (rem, vh, vw, etc.)
    - `functions/` - CSS function handlers (calc, color-mix, filters, etc.)
    - `shorthands/` - Shorthand property expansion (border, transform, etc.)
  - `conditions/` - Conditional style evaluation
    - `media-query.ts` - Media query evaluation
    - `container-query.ts` - Container query evaluation
    - `attributes.ts` - Attribute selectors

### 5. Components (`src/components/`)

Wrapped React Native components with className support. These re-export React Native components with CSS capabilities.

### 6. Web Runtime (`src/web/`)

Fallback runtime for web platform - delegates to native web CSS behavior.

## Data Structures

### StyleRule
The compiled representation of CSS rules with:
- `s` - Specificity array
- `d` - Style declarations
- `v` - Variables
- `m` - Media conditions
- `p` - Pseudo-class queries
- `cq` - Container queries
- `aq` - Attribute queries
- `a` - Animation flag

### StyleDescriptor
Values in style declarations can be:
- Primitives (string, number, boolean)
- StyleFunction - Runtime function calls like `calc()`, `var()`, etc.
- Arrays of descriptors

## Testing Strategy

### Compiler and Babel (TDD)
- Tests in `src/__tests__/compiler/` and `src/__tests__/babel/`
- Use VSCode's JavaScript Debug Terminal for breakpoint debugging
- Changes require rebuild (`yarn build`)

### Native Runtime
- Tests in `src/__tests__/native/`
- Uses `@testing-library/react-native` and `jest-expo`
- Run with `yarn test native`

## Important Development Notes

### Hot Reloading Limitations

**Metro transformer and Babel plugin do NOT support hot reloading.**

After changes to these areas:
```bash
yarn build
yarn example start --clean  # or start:build
```

Changes to the native runtime (`src/native/`) typically fast-refresh in the example app, but Metro/Babel changes always require a full rebuild and cache clear.

### Debugging

Enable debug logging:
```bash
yarn example start:debug
```

This prints parsed CSS and style objects to console via the `debug` package.

For breakpoint debugging, use VSCode's JavaScript Debug Terminal or set NodeJS debugger environment variables.

## Monorepo Structure

This is a Yarn workspaces monorepo:
- Root package: The library (`react-native-css`)
- `example/`: Example Expo app demonstrating library usage
- `configs/`: Shared configuration packages

The example app uses the local version of the library, so changes are reflected immediately (subject to hot reload limitations above).

## Module Exports

The library has multiple entry points (see `package.json` exports):
- `react-native-css` - Main runtime API
- `react-native-css/compiler` - CSS compiler
- `react-native-css/babel` - Babel plugin
- `react-native-css/components` - Wrapped RN components
- `react-native-css/metro` - Metro bundler integration
- `react-native-css/native` - Native runtime internals
- `react-native-css/web` - Web runtime
- `react-native-css/jest` - Jest configuration helpers

## Code Style

- Uses Prettier with custom import order plugin
- ESLint with TypeScript ESLint
- Conventional commits enforced by commitlint
- Pre-commit hooks via lefthook verify linting and tests

## Requirements

- Node.js >= 20 (enforced by Metro plugin)
- Yarn 4 (via Corepack)
- Bash environment for scripts
- React >= 19
- React Native >= 0.81
- lightningcss >= 1.27.0
