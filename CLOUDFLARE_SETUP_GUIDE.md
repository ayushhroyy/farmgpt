# 🚀 Cloudflare Pages Setup Guide for FarmGPT

## Quick Setup Steps

### 1. Get Your OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/keys)
2. Sign up/log in
3. Generate an API key
4. Copy the API key (starts with `sk-or-v1-`)

### 2. Set Up Cloudflare Secret

**For Cloudflare Pages:**

1. Go to your Cloudflare Pages dashboard
2. Select your project: `farmgpt`
3. Go to **Settings** → **Environment variables**
4. Add the following:

**Variable Name:** `VITE_OPENROUTER_API_KEY`
**Value:** `your_actual_openrouter_api_key_here` (paste your key)
**Environment:** Production + Preview (select both)

### 3. Alternative: Using Cloudflare Secrets

If you want to use Cloudflare secrets instead:

1. Go to **Workers & Pages** → **Your Project** → **Settings**
2. Go to **Secrets** section
3. Add secret:
   - **Name:** `openrouter`
   - **Value:** your OpenRouter API key

Then update your build script to read from secrets:

```bash
# In your Cloudflare build settings
VITE_OPENROUTER_API_KEY = [use secret: openrouter]
```

### 4. Local Development Setup

1. **Copy the example .env file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file and add your OpenRouter API key:**
   ```bash
   VITE_OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### 5. Test Your Setup

After setting up the API key:

1. Test voice queries - should work without 401 errors
2. Test image analysis - should analyze farm/solar content
3. Test report generation - should generate crop recommendations
4. Test water calculator - should analyze water usage

## Troubleshooting

### Error: "VITE_OPENROUTER_API_KEY is not set"

**Problem:** The environment variable is not configured
**Solution:**
- For local dev: Add to `.env` file
- For Cloudflare: Add to Environment variables in project settings

### Error: "401 Missing Authentication header"

**Problem:** Invalid or missing API key
**Solution:**
- Check your OpenRouter API key is correct
- Ensure it starts with `sk-or-v1-`
- Verify the environment variable name matches exactly: `VITE_OPENROUTER_API_KEY`

### Report page crashes

**Problem:** OpenRouter API calls failing
**Solution:**
- The app has fallback error handling
- Check browser console for specific errors
- Ensure API key is set and valid

### Environment variables not working in production

**Problem:** Variables not exposed to client-side code
**Solution:**
- Vite requires `VITE_` prefix for client-side variables
- Ensure you're using `VITE_OPENROUTER_API_KEY` (not `OPENROUTER_API_KEY`)
- Rebuild and redeploy after adding variables

## Verification

Test that your setup works:

```javascript
// In browser console on your deployed site
console.log(import.meta.env.VITE_OPENROUTER_API_KEY);
// Should show your API key (not undefined)
```

## Security Notes

✅ **Safe to commit:** `.env.example` (no real keys)
❌ **Never commit:** `.env` file (contains real keys)
✅ **Use Cloudflare secrets** for production deployment
✅ **Keep API keys private** and rotate periodically

## Deployment Checklist

Before deploying to production:

- [ ] OpenRouter API key set in Cloudflare environment variables
- [ ] Test all AI features work (voice, image, reports)
- [ ] Check browser console for errors
- [ ] Test on both desktop and mobile
- [ ] Verify bilingual support (English/Hindi)

---

**Project:** FarmGPT (JalDhara)
**Text Model:** deepseek/deepseek-v4-flash
**Vision Model:** google/gemini-2.5-flash-lite via OpenRouter
**API Provider:** OpenRouter.ai
