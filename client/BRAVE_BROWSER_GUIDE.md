# Brave Browser Compatibility Guide

If you're experiencing issues with the Online Auction System in Brave browser, this guide will help you resolve them.

## Common Issues and Solutions

### 1. Blank/White Page
If you see a blank page when accessing the application:

**Solution:**
1. Click on the Brave Shields icon in the address bar (lion icon)
2. Turn off "Shields" for this site
3. Refresh the page

### 2. Scripts Being Blocked
Brave's enhanced privacy features may block certain scripts:

**Solution:**
1. Open Developer Tools (F12)
2. Check the Console tab for any blocked script errors
3. If you see blocked resources, click the Shields icon and:
   - Set "Block ads and tracking" to "Allow"
   - Set "Block scripts" to "Allow"

### 3. WebSocket Connection Issues
You might see errors like "WebSocket connection to 'ws://localhost:5173/' failed":

**Automatic Solutions (Already Implemented):**
- ✅ Custom error suppression script handles these errors gracefully
- ✅ Console errors are converted to informational messages
- ✅ Application continues to work normally without hot reload

**Manual Solutions if Issues Persist:**
1. **Use alternative dev scripts:**
   - `npm run dev:no-hmr` - Completely disables HMR
   - `npm run dev:safe` - Safe mode with forced refresh
   - `npm run dev:polling` - Uses polling instead of WebSocket

2. **Environment Configuration:**
   - Add `DISABLE_HMR=true` to your `.env` file
   - This permanently disables WebSocket connections

3. **Browser Settings:**
   - Allow WebSockets in Brave settings
   - Disable "Block all device recognition APIs"

**Note:** These errors are cosmetic only and don't affect application functionality. The app includes automatic error handling.

### 4. AdSense Related Issues
The application includes Google AdSense which Brave blocks by default:

**Note:** The application is designed to work even when ads are blocked. If you're still experiencing issues, the AdSense blocker might be interfering with other scripts.

**Solution:**
1. Disable Shields for this specific site
2. Or use a different browser for development/testing

## Recommended Settings for Development

For the best development experience in Brave:

1. **Disable Shields for localhost:**
   - Go to `brave://settings/shields`
   - Add `localhost` to the exceptions list

2. **Developer Mode:**
   - Go to `brave://settings/`
   - Search for "Developer mode" 
   - Enable developer-friendly settings

## Alternative Solutions

If issues persist:

1. **Use Brave's Private Window**: Sometimes helps bypass certain blocking mechanisms
2. **Use Chrome/Firefox**: For development purposes
3. **Check Brave Version**: Ensure you're using the latest version

## Reporting Issues

If none of these solutions work:
1. Check browser console for specific error messages
2. Try the application in an incognito/private window
3. Report the issue with your Brave version and any console errors

---

*This application is fully compatible with all major browsers. Brave's enhanced privacy features may require manual configuration for optimal experience.*