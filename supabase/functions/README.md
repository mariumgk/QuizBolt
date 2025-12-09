# Edge Functions - TypeScript Notes

These Edge Functions are written for **Deno runtime** in Supabase, not Node.js.

## Expected TypeScript Errors

When viewing these files in your IDE, you may see TypeScript errors like:
- "Cannot find module 'https://deno.land/...'"
- "Cannot find name 'Deno'"

**These errors are expected and can be safely ignored.** The files use Deno-specific imports and APIs that TypeScript doesn't recognize in a Node.js environment.

## Why the Errors Occur

- Your IDE is configured for Node.js and TypeScript
- Deno uses URL-based imports (e.g., `https://deno.land/...`)
- Deno has global APIs like `Deno.env` that don't exist in Node.js
- The files will work perfectly when deployed to Supabase Edge Functions (Deno runtime)

## Development vs Deployment

- **Development**: TypeScript errors appear in IDE (can be ignored)
- **Deployment**: Functions run flawlessly in Deno on Supabase

The `tsconfig.json` files in each function directory reduce the number of errors shown, but some Deno-specific errors will remain. This is normal and expected.

## Testing

To test these functions:
1. Deploy to Supabase: `supabase functions deploy <function-name>`
2. Test via Supabase Dashboard or curl (see DEPLOYMENT.md)
3. Errors will only surface if there are actual runtime issues

## Alternative: Deno Extension

If you want full Deno support in VS Code:
1. Install the "Deno" extension
2. Create a `.vscode/settings.json` with:
   ```json
   {
     "deno.enable": true,
     "deno.enablePaths": ["supabase/functions"]
   }
   ```

This will enable Deno checking for Edge Functions specifically.
