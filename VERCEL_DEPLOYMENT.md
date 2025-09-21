# Vercel Deployment Guide

## Current Issue: Google Cloud Authentication Error

Your Vercel deployment is failing because it's trying to use Google Cloud Vertex AI without proper authentication credentials.

## Quick Fix (Recommended for Demo)

The app has been updated to work in **mock mode** when Google Cloud credentials are not available. Your app should now work without any environment variables set.

### What happens in mock mode:

- ✅ Document analysis still works (using smart pattern matching)
- ✅ Chat interface still works (using pre-built responses)
- ✅ All UI features remain functional
- ⚠️ Responses are generated using pattern matching instead of AI

## Production Setup (Optional)

If you want to enable full AI functionality with Google Cloud Vertex AI:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Vertex AI API**

### 2. Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "vercel-vertex-ai")
4. Grant it the **Vertex AI User** role
5. Click **Create Key** → **JSON** and download the file

### 3. Configure Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
GCP_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
GCP_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro
```

**Important:** For the `GOOGLE_APPLICATION_CREDENTIALS`, you need to:

- Open the downloaded JSON file
- Copy the entire contents
- Paste it as the value (it should be one long line of JSON)

### 4. Redeploy

After adding the environment variables, redeploy your application.

## Testing

### Mock Mode (Current)

- Upload a document
- Run any analysis (Summary, Key Risk Insights, etc.)
- Ask questions in the chat
- Everything should work without errors

### Full AI Mode (After setup)

- Same as above, but responses will be more dynamic and contextual
- Better conversation flow
- Enhanced document understanding

## Troubleshooting

### If you still get authentication errors:

1. Check that `GCP_PROJECT_ID` is set correctly
2. Verify the JSON in `GOOGLE_APPLICATION_CREDENTIALS` is valid
3. Ensure the service account has the **Vertex AI User** role
4. Make sure the Vertex AI API is enabled in your Google Cloud project

### If mock mode isn't working:

1. Check the Vercel function logs
2. Look for any remaining `!` operators in the code
3. Ensure the environment variables are properly set

## Cost Considerations

- **Mock Mode**: Free, works without Google Cloud
- **Full AI Mode**: Uses Google Cloud Vertex AI (Gemini 1.5 Pro)
  - Typical cost: $0.0025 per 1K characters for input, $0.0075 per 1K characters for output
  - For a typical document analysis: ~$0.01-0.05 per document

## Next Steps

1. **Immediate**: Your app should now work in mock mode
2. **Optional**: Set up Google Cloud for full AI functionality
3. **Future**: Consider adding other AI providers (OpenAI, Anthropic) as alternatives
