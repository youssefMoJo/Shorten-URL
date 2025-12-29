# Shorten-URL Chrome Extension

Created and launched a Chrome extension for efficient web link sharing, with future feature updates planned. Successfully published the extension on the Chrome Web Store, expanding its accessibility.

https://chrome.google.com/webstore/detail/shorten-url/pkdhbhbeapnenbeihmabpgmeeinbdpgc

![NShortenURL 07940afa4757b378fd79](https://github.com/youssefMoJo/Shorten-URL/assets/48146406/014894ca-0b4f-49c8-9773-2041f758bb63)

## Environment Configuration

The extension can be configured to work with different environments (dev/prod) by switching the config file.

### Files

- `config.js` - Active configuration (currently set to DEV)
- `config.dev.js` - Development environment (uses dev.shorturl.life)
- `config.prod.js` - Production environment (uses shorturl.life)

### Switching Between Environments

**For Development Testing:**
```bash
cp config.dev.js config.js
```

**For Production:**
```bash
cp config.prod.js config.js
```

After switching, reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Click the reload icon for the Shorten-URL extension

### Environment URLs

- **Dev:** https://dev.shorturl.life
- **Prod:** https://shorturl.life

## Testing with dev.shorturl.life

Before applying changes to production:

1. Ensure terraform has been applied in `terraform/dev/` with custom domain configuration
2. Wait for DNS propagation (5-10 minutes)
3. Switch extension to dev config: `cp config.dev.js config.js`
4. Reload extension in Chrome
5. Test all functionality
6. Once verified, switch to prod config and deploy
