import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateAgencyUserPayload {
  email: string
  agency_name: string
  agency_slug: string
  license_number: string
  contact_phone: string
  address: string
  city: string
  postal_code: string
  logo_url: string
  primary_color: string
  secondary_color: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer et valider le corps de la requête
    const payload: CreateAgencyUserPayload = await req.json()
    const { 
      email, 
      agency_name, 
      agency_slug, 
      license_number,
      contact_phone,
      address,
      city,
      postal_code,
      logo_url,
      primary_color,
      secondary_color
    } = payload

    console.log('Creating agency user with payload:', payload)

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUser?.users.some(user => user.email === email)) {
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Vérifier si la licence existe déjà
    const { data: existingLicense } = await supabaseAdmin
      .from('agencies')
      .select('license_number')
      .eq('license_number', license_number)
      .single()

    if (existingLicense) {
      return new Response(
        JSON.stringify({ error: 'License number already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Vérifier si le slug existe déjà
    const { data: existingSlug } = await supabaseAdmin
      .from('agencies')
      .select('slug')
      .eq('slug', agency_slug)
      .single()

    if (existingSlug) {
      return new Response(
        JSON.stringify({ error: 'Slug already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Créer l'utilisateur avec l'API admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'passer2025',
      email_confirm: true,
      user_metadata: {
        role: 'AGENCY'
      }
    })

    if (userError || !userData.user) {
      console.error('Error creating user:', userError)
      throw userError
    }

    console.log('User created successfully:', userData.user)

    // Créer l'entrée dans la table agencies
    const { data: agencyData, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        user_id: userData.user.id,
        agency_name,
        slug: agency_slug,
        license_number,
        contact_email: email,
        contact_phone,
        address,
        city,
        postal_code,
        logo_url,
        primary_color,
        secondary_color,
        is_active: true,
        must_change_password: true
      })
      .select()
      .single()

    if (agencyError) {
      console.error('Error creating agency:', agencyError)
      // Supprimer l'utilisateur créé si l'agence n'a pas pu être créée
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
      throw agencyError
    }

    console.log('Agency created successfully:', agencyData)

    return new Response(
      JSON.stringify(agencyData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})