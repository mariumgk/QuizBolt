# Layer 1 Testing Guide

This guide provides step-by-step instructions for testing the Layer 1 implementation of QuizBolt's RAG ingestion and chat features.

## Prerequisites

1. **Deploy Edge Functions**
   ```bash
   cd supabase
   supabase functions deploy extract-text
   supabase functions deploy fetch-url
   ```

2. **Verify Environment Variables**
   Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test 1: PDF Upload and Ingestion

### Steps:
1. Navigate to `http://localhost:3000/upload`
2. Click the "Upload PDF" tab (or ensure it's selected)
3. Drag and drop a PDF file or click to browse
4. Wait for the upload to complete
5. Click "Process Document"

### Expected Results:
- ✅ PDF uploads successfully to Supabase Storage
- ✅ `extract-text` Edge Function is called
- ✅ Text is extracted from the PDF
- ✅ Text is cleaned and chunked
- ✅ Chunks are embedded with OpenAI
- ✅ Chunks are stored in `document_chunks` table
- ✅ Success message appears with document ID
- ✅ No errors in browser console

### Verification:
Check Supabase Dashboard:
- `documents` table should have a new row
- `document_chunks` table should have multiple rows with the same `doc_id`
- Each chunk should have an `embedding` vector (1536 dimensions)

### Common Issues:
- **Empty text extraction**: PDF may be scanned or have complex formatting
- **Edge Function timeout**: Large PDFs may take time to process
- **No chunks created**: Check that cleanedText is not empty

## Test 2: URL Content Ingestion

### Steps:
1. Navigate to `http://localhost:3000/upload`
2. Click the "From URL" tab
3. Enter a URL (e.g., `https://en.wikipedia.org/wiki/Artificial_intelligence`)
4. Click "Process Document"

### Expected Results:
- ✅ `fetch-url` Edge Function is called
- ✅ HTML content is fetched and cleaned
- ✅ Text is extracted from HTML
- ✅ Chunks are created and stored
- ✅ Success message appears

### Verification:
- Check that the ingested text doesn't contain HTML tags
- Verify text is readable and makes sense
- Check Supabase `documents` table for new row with `source_label` as the URL

### Common Issues:
- **Empty content**: Website may require JavaScript or block automated requests
- **Timeout**: Website may be slow to respond
- **Invalid URL**: Ensure URL includes protocol (http:// or https://)

## Test 3: Text Paste Ingestion

### Steps:
1. Navigate to `http://localhost:3000/upload`
2. Click the "Paste Text" tab
3. Paste sample text (at least 500 characters for good results)
4. Click "Process Document"

### Expected Results:
- ✅ Text is processed immediately (no Edge Function call)
- ✅ Text is cleaned and chunked
- ✅ Chunks are embedded and stored
- ✅ Success message appears

### Verification:
- This is the fastest ingestion method (no network calls)
- Should succeed reliably if OpenAI API is working

## Test 4: RAG Chat - Basic Question

### Steps:
1. After uploading a document (from Test 1, 2, or 3), note the document ID
2. Navigate to `http://localhost:3000/chat/[docId]` (replace `[docId]` with actual ID)
3. Type a question related to the document content
4. Press Enter or click "Send"

### Expected Results:
- ✅ Question appears in chat with "YOU" avatar
- ✅ "AI is thinking..." message appears briefly
- ✅ AI response appears with "AI" avatar
- ✅ Citations section appears below AI response
- ✅ Citations show numbered sources with text snippets
- ✅ Response is relevant to the query and document content

### Example Questions:
- "What is this document about?"
- "Summarize the main points"
- "What are the key concepts mentioned?"

### Verification:
- Click on a citation to expand the full text
- Verify the citation text actually appears in your original document
- Check that chunk index numbers make sense (sequential)

## Test 5: RAG Chat - Conversation History

### Steps:
1. Continue from Test 4 in the same chat session
2. Ask a follow-up question that references the previous conversation
3. Example: "Can you explain more about that?" or "What else is important?"

### Expected Results:
- ✅ AI maintains context from previous messages
- ✅ Response builds on previous conversation
- ✅ History is properly included in RAG query

### Verification:
- The AI should reference information from previous answers
- Context should feel natural and connected

## Test 6: Citation Interaction

### Steps:
1. In an active chat with citations
2. Click on a collapsed citation (with "..." at the end)
3. Click again to collapse it

### Expected Results:
- ✅ Citation expands to show full text
- ✅ Smooth animation when expanding/collapsing
- ✅ Chevron icon changes direction
- ✅ Full text is readable

## Test 7: Error Handling

### Steps:
1. Test with an invalid document ID: `http://localhost:3000/chat/invalid-id`
2. Ask a question
3. Test with OpenAI API key removed from `.env.local`
4. Ask a question

### Expected Results:
- ✅ Error message appears in red alert box
- ✅ Error is user-friendly (not technical stack trace)
- ✅ Chat remains usable after error
- ✅ User can retry after fixing the issue

## Test 8: Edge Cases

### Test Empty Results:
1. Navigate to chat with a valid document
2. Ask a completely off-topic question
3. Example: "What is the weather in Paris?" (for a technical document)

**Expected**: AI should respond based only on document context or say it doesn't know

### Test Long Conversation:
1. Have a conversation with 10+ back-and-forth messages
2. Verify performance remains good
3. Check that context window doesn't overflow

### Test Special Characters:
1. Upload text with special characters, emojis, code snippets
2. Verify they're preserved correctly in chunks
3. Ask about them in chat

## Debugging Tips

### Check Browser Console:
- Open DevTools (F12)
- Look for red errors during upload or chat
- Common issues: CORS errors, failed fetch requests, JSON parse errors

### Check Supabase Logs:
- Open Supabase Dashboard → Edge Functions
- Click on function name
- View logs for errors or warnings
- Look for "No text extracted" or timeout errors

### Check Network Tab:
- Open DevTools → Network tab
- Watch for Edge Function calls
- Check request/response payloads
- Verify HTTP status codes (200 = success)

### Database Verification:
- Open Supabase Dashboard → Table Editor
- Check `documents` table for new entries
- Check `document_chunks` table for chunks
- Verify `embedding` column is populated (not null)

## Success Criteria

Layer 1 is considered fully tested when:
- ✅ All three ingestion methods work (PDF, URL, Text)
- ✅ Edge Functions extract non-empty text
- ✅ Chunks are successfully created and stored
- ✅ Embeddings are generated for all chunks
- ✅ Chat responds to queries with relevant answers
- ✅ Citations display correctly with proper sources
- ✅ Conversation history is maintained
- ✅ Error messages are user-friendly
- ✅ No console errors or warnings

## Known Limitations

1. **PDF Extraction**: Basic implementation may not work with scanned PDFs or complex layouts
2. **URL Fetching**: May not work with JavaScript-heavy sites or sites that block bots
3. **Context Window**: Very long documents may exceed OpenAI token limits
4. **No Streaming**: Chat responses appear all at once (not word-by-word)

## Next Steps

After Layer 1 is fully tested and working:
1. Report any bugs or issues
2. Proceed with Layer 2 implementation (Quiz Generation)
3. Consider production improvements for PDF parsing
