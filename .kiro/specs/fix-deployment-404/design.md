# Design Document

## Overview

The deployment issue is caused by missing SPA routing configuration on Render.com's static site hosting. When users access the deployed URL, the server cannot find the requested file and returns a 404 error instead of serving the index.html file. This design outlines the necessary configuration changes to fix the routing and ensure proper deployment.

## Architecture

### Current State
- Frontend built with Vite and React
- Deployed as a static site on Render.com
- Missing server-side routing configuration for SPA
- No fallback to index.html for client-side routes

### Target State
- Add `_redirects` file for Render.com SPA routing
- Configure Vite to include routing configuration in build
- Ensure all static assets are properly referenced
- Verify build output structure matches Render.com expectations

## Components and Interfaces

### 1. Render.com Redirects Configuration

**File:** `client/public/_redirects`

This file tells Render.com's static site hosting to redirect all requests to index.html, allowing React Router to handle routing on the client side.

```
/*    /index.html   200
```

**Purpose:**
- Catch all routes and serve index.html
- Enable SPA routing without 404 errors
- Maintain URL structure for bookmarking and sharing

### 2. Vite Build Configuration

**File:** `client/vite.config.ts`

Ensure the build configuration:
- Outputs to `dist` directory
- Includes public assets in the build
- Generates correct asset paths
- Preserves the `_redirects` file

**Key Settings:**
```typescript
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  copyPublicDir: true  // Ensures _redirects is copied
}
```

### 3. Public Assets Structure

**Directory:** `client/public/`

Required files:
- `_redirects` - Routing configuration
- `manifest.json` - PWA manifest
- Logo files (logo.svg, logo-32.png, etc.)
- Favicon files

### 4. Index HTML Configuration

**File:** `client/index.html`

Ensure:
- Correct base path (default `/`)
- All asset references use relative paths
- Meta tags for PWA are present
- Fallback loading indicator

## Data Models

### Build Output Structure
```
dist/
├── index.html          # Entry point
├── assets/             # JS, CSS bundles
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── _redirects          # Routing config
├── manifest.json       # PWA manifest
├── logo.svg            # Logo files
└── ...                 # Other public assets
```

### Render.com Configuration
```json
{
  "name": "yt-downloader-frontend",
  "type": "static_site",
  "rootDir": "client",
  "buildCommand": "npm install && npm run build",
  "publishDir": "dist",
  "envVars": {
    "VITE_BACKEND_URL": "https://yt-downloader-backend.onrender.com"
  }
}
```

## Error Handling

### Build Failures
- **Issue:** Build command fails
- **Solution:** Check TypeScript errors, missing dependencies
- **Fallback:** Run `npm install` and `npm run build` locally first

### Missing Assets
- **Issue:** Assets not found after deployment
- **Solution:** Verify `copyPublicDir: true` in vite.config.ts
- **Fallback:** Manually check dist folder contents before deploying

### Routing Still Broken
- **Issue:** _redirects file not working
- **Solution:** Verify file is in dist folder after build
- **Fallback:** Use render.yaml configuration file instead

### Environment Variables
- **Issue:** Backend URL not configured
- **Solution:** Set VITE_BACKEND_URL in Render.com dashboard
- **Fallback:** Check browser console for API connection errors

## Testing Strategy

### Local Testing
1. Run `npm run build` in client directory
2. Verify `dist/_redirects` file exists
3. Run `npm run preview` to test production build locally
4. Test all routes work correctly

### Deployment Testing
1. Deploy to Render.com
2. Access root URL and verify homepage loads
3. Test direct access to different routes (e.g., /downloads, /settings)
4. Verify browser refresh maintains current route
5. Check browser console for any 404 errors on assets

### Verification Checklist
- [ ] Homepage loads without errors
- [ ] All CSS and JS files load correctly
- [ ] Logo and favicon display properly
- [ ] Client-side routing works (no 404 on navigation)
- [ ] Direct URL access works for all routes
- [ ] Page refresh maintains current route
- [ ] Backend API connection works (if VITE_BACKEND_URL is set)
- [ ] PWA manifest loads correctly
- [ ] No console errors related to missing files

## Implementation Notes

### Critical Files to Create/Modify
1. `client/public/_redirects` - NEW FILE (most important)
2. `client/vite.config.ts` - Verify copyPublicDir setting
3. `DEPLOYMENT_ONLINE.md` - Update with _redirects information

### Render.com Settings to Verify
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables: `VITE_BACKEND_URL` (if backend is deployed)

### Common Pitfalls
- Forgetting to create `_redirects` file
- Placing `_redirects` in wrong directory (must be in `public/`)
- Incorrect Render.com publish directory setting
- Missing `copyPublicDir` in Vite config
- Not rebuilding after adding `_redirects`

## Alternative Solutions

### Option 1: render.yaml Configuration
If `_redirects` doesn't work, create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: yt-downloader-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Option 2: Vercel Deployment
Switch to Vercel which has automatic SPA routing:
- No `_redirects` file needed
- Automatic route handling
- Better performance for static sites

### Option 3: Custom Server
Add a simple Express server to handle routing:
- More control over routing
- Can add server-side logic
- Requires switching from static site to web service
