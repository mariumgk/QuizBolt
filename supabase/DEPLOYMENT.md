# Supabase Edge Functions Deployment

This document explains how to deploy the QuizBolt Edge Functions to Supabase.

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Environment Variables

The Edge Functions require the following environment variables:

- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided by Supabase

No additional configuration is needed.

## Deploy Functions

### Deploy All Functions

```bash
supabase functions deploy extract-text
supabase functions deploy fetch-url
```

### Deploy Individual Functions

Deploy the PDF text extraction function:
```bash
supabase functions deploy extract-text
```

Deploy the URL content fetching function:
```bash
supabase functions deploy fetch-url
```

## Testing Functions

You can test the functions using the Supabase Dashboard or curl:

### Test extract-text

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-text' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"path":"documents/user-id/test.pdf"}'
```

### Test fetch-url

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-url' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://example.com/article"}'
```

## Important Notes

### PDF Extraction Limitations

The `extract-text` function currently uses basic PDF text extraction. This works for simple PDFs but may not handle:
- Scanned PDFs (without OCR)
- Complex layouts with multiple columns
- PDFs with embedded images containing text

For production use, consider:
- Using an external PDF parsing service (e.g., Adobe PDF Services API, pdf.co)
- Implementing OCR for scanned documents
- Using a more robust PDF library

### URL Fetching Limitations

The `fetch-url` function:
- Has a 30-second timeout
- Only supports HTTP/HTTPS protocols
- May not work with JavaScript-heavy websites (no browser rendering)
- Strips all HTML tags to extract plain text

For better results with dynamic websites, consider using a headless browser service.

## Troubleshooting

### Function deployment fails

- Ensure you're logged in: `supabase login`
- Check your project link: `supabase link --project-ref YOUR_PROJECT_REF`
- Verify you have internet connectivity

### Function returns empty text

- For PDFs: The PDF may be scanned or have complex formatting
- For URLs: The website may use JavaScript rendering or block automated requests
- Check function logs in Supabase Dashboard for detailed errors

### Permission errors

- Ensure the service role key is properly set (automatic in Edge Functions)
- Verify RLS policies on the documents bucket allow reading
