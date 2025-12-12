
// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
// 1. supabase login
// 2. supabase functions new send-sms
// 3. Paste this code into supabase/functions/send-sms/index.ts
// 4. supabase functions deploy send-sms

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, sender, receptor, message } = await req.json()

    if (!apiKey || !receptor || !message) {
      throw new Error("Missing required parameters: apiKey, receptor, or message")
    }

    const encodedMessage = encodeURIComponent(message)
    const targetUrl = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json?receptor=${receptor}&sender=${sender}&message=${encodedMessage}`

    console.log(`Sending SMS to ${receptor}`)

    // Direct call to KavehNegar (No proxy needed here as Deno runs on server)
    const response = await fetch(targetUrl)
    
    if (!response.ok) {
        throw new Error(`KavehNegar API Network Error: ${response.statusText}`);
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ success: true, data: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})
