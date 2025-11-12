# Retrieving Supabase Service Role Key from Lovable Cloud

## ⚠️ CRITICAL SECURITY WARNING

The service role key grants **full administrative access** to your Supabase database. This process should only be used when absolutely necessary, and the temporary function **MUST** be deleted immediately after retrieving the key.

## When You Need This

You may need the service role key to:
- Perform administrative database operations
- Bypass Row Level Security (RLS) for specific operations
- Use external tools that require service role access
- Set up integrations that need elevated permissions

## Prerequisites

- A Lovable Cloud project with Supabase configured
- Access to create and deploy edge functions
- Understanding of the security implications

## Step-by-Step Process

### Step 1: Create the Temporary Edge Function

Create a new file at `supabase/functions/get-service-key/index.ts` with the following content:

```typescript
// ⚠️⚠️⚠️ TEMPORARY FUNCTION - DELETE IMMEDIATELY AFTER USE ⚠️⚠️⚠️
// This function exposes the service role key and should NEVER remain deployed
// Created: [Current Date]
// Purpose: Retrieve service role key from Lovable secrets
// Action Required: DELETE THIS FILE AND FUNCTION AFTER RETRIEVING THE KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ⚠️ SECURITY WARNING: Exposing service role key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Service role key not found in environment',
          message: 'SUPABASE_SERVICE_ROLE_KEY is not set'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Return the key
    return new Response(
      JSON.stringify({ 
        serviceRoleKey,
        warning: '⚠️ DELETE THIS FUNCTION IMMEDIATELY AFTER RETRIEVING THE KEY',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: 'Failed to retrieve service role key'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

### Step 2: Configure the Function as Public

Add the following configuration to your `supabase/config.toml` file (right after the `project_id` line):

```toml
[functions.get-service-key]
verify_jwt = false
```

**Note:** This makes the function publicly accessible without authentication. This is necessary because you need to call it without a user session, but it's also why this function is extremely dangerous if left deployed.

### Step 3: Deploy the Function

The function will deploy automatically with your next code push in Lovable. If you need to deploy it manually:

```bash
# Using Lovable's deployment tool
# The function deploys automatically when you save the files
```

### Step 4: Call the Function

You can call the function using any HTTP client. Here are examples:

**Using curl:**
```bash
curl -X GET \
  'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/get-service-key' \
  -H 'Authorization: Bearer [YOUR-ANON-KEY]'
```

**Using JavaScript/TypeScript:**
```typescript
const response = await fetch(
  'https://[YOUR-PROJECT-ID].supabase.co/functions/v1/get-service-key',
  {
    headers: {
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  }
);

const data = await response.json();
console.log('Service Role Key:', data.serviceRoleKey);
```

**Using Supabase client:**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('get-service-key');
if (data) {
  console.log('Service Role Key:', data.serviceRoleKey);
}
```

### Step 5: Store the Key Securely

Once you have the key:

1. **Copy it immediately** to a secure password manager or secrets vault
2. **Never** commit it to version control
3. **Never** expose it in client-side code
4. **Never** log it in production environments
5. Use it only in secure server-side contexts

### Step 6: DELETE THE FUNCTION IMMEDIATELY

This is the most critical step. Delete the function as soon as you have the key:

1. Delete the file: `supabase/functions/get-service-key/index.ts`
2. Remove the configuration from `supabase/config.toml`:
   ```toml
   # Remove these lines:
   [functions.get-service-key]
   verify_jwt = false
   ```

## Security Best Practices

### Why This Function Is Dangerous

1. **No Authentication Required:** The function is publicly accessible
2. **Full Database Access:** The service role key bypasses all RLS policies
3. **Potential for Abuse:** Anyone who finds the endpoint can get your key
4. **Data Breach Risk:** Exposure could lead to complete database compromise

### Safe Alternatives

Consider these alternatives before using this method:

1. **Use RLS Policies:** Design your database with proper Row Level Security
2. **Use Authenticated Functions:** Most operations can be done with user auth
3. **Use Database Functions:** Create PostgreSQL functions with SECURITY DEFINER
4. **Contact Lovable Support:** They may be able to provide the key securely

### If You Must Use the Service Role Key

When using the service role key in your application:

1. **Only in Edge Functions:** Never use in client-side code
2. **Validate All Inputs:** Prevent SQL injection and data validation issues
3. **Audit Usage:** Log all operations that use the service role key
4. **Principle of Least Privilege:** Only use it for operations that absolutely require it
5. **Temporary Usage:** Consider rotating the key after use if possible

## Troubleshooting

### 401 Error: Missing Authorization Header

If you get a 401 error, it means:
- The function configuration hasn't been deployed yet (wait a few minutes)
- The `verify_jwt = false` setting isn't in the config.toml
- Try calling with the anon key in the Authorization header

### 404 Error: Function Not Found

- The function hasn't been deployed yet
- Check the function name matches exactly: `get-service-key`
- Verify the file is in the correct location: `supabase/functions/get-service-key/index.ts`

### Empty Response or No Key

- The `SUPABASE_SERVICE_ROLE_KEY` environment variable isn't set
- This should be automatically set by Lovable Cloud
- Contact Lovable support if the key is missing

## Additional Notes

- This process is specific to **Lovable Cloud** projects
- The service role key is automatically provisioned by Lovable
- This method only works because Lovable Cloud provides the key as an environment variable
- For non-Lovable projects, you'd get the service role key from the Supabase dashboard

## Checklist

Before proceeding:
- [ ] I understand the security implications
- [ ] I have a legitimate need for the service role key
- [ ] I have a secure place to store the key
- [ ] I will delete the function immediately after use
- [ ] I will not commit the key to version control

After completion:
- [ ] Service role key retrieved and stored securely
- [ ] Function file deleted: `supabase/functions/get-service-key/index.ts`
- [ ] Configuration removed from `supabase/config.toml`
- [ ] Changes committed and deployed
- [ ] Function no longer accessible

## Support

If you have questions or issues:
- Visit the [Lovable Discord community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Check the [Lovable documentation](https://docs.lovable.dev/)
- Contact Lovable support through the platform

---

**Remember:** This is a temporary, high-risk operation. The function should exist for minutes, not hours or days. Delete it immediately after retrieving the key.
