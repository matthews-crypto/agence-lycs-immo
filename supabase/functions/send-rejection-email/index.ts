import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendRejectionEmailPayload {
  agency_name: string
  contact_email: string
  rejection_reason: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const payload: SendRejectionEmailPayload = await req.json()
    console.log('Sending rejection email with payload:', payload)

    const { data, error: emailError } = await resend.emails.send({
      from: 'Lovable <onboarding@resend.dev>',
      to: [payload.contact_email],
      subject: `Demande d'inscription refusée - ${payload.agency_name}`,
      html: `
        <h1>Votre demande d'inscription a été refusée</h1>
        <p>Cher(e) représentant(e) de ${payload.agency_name},</p>
        <p>Nous regrettons de vous informer que votre demande d'inscription a été refusée pour la raison suivante :</p>
        <blockquote style="border-left: 4px solid #ccc; margin: 1.5em 0; padding: 0.5em 1em;">
          ${payload.rejection_reason}
        </blockquote>
        <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre une nouvelle demande, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br>L'équipe Lovable</p>
      `
    })

    if (emailError) {
      throw emailError
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})