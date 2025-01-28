import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateAgencyUserPayload {
  agency_name: string
  contact_email: string
  contact_phone: string
  license_number: string
  slug: string
  address: string
  city: string
  postal_code: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  admin_name?: string
  admin_email?: string
  admin_phone?: string
  admin_license?: string
  password_hash?: string
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
    console.log('Creating agency user with payload:', payload)

    if (!payload.contact_email) {
      throw new Error('Email is required')
    }

    // Vérifier si l'email existe déjà
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    if (existingUsers?.users.some(user => user.email === payload.contact_email)) {
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
      .eq('license_number', payload.license_number)
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
      .eq('slug', payload.slug)
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
      email: payload.contact_email,
      email_confirm: true,
      user_metadata: {
        role: 'AGENCY'
      },
      password: 'passer2025' // Mot de passe par défaut
    })

    if (userError || !userData.user) {
      console.error('Error creating user:', userError)
      return new Response(
        JSON.stringify({ error: userError?.message || 'Failed to create user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User created successfully:', userData.user)

    // Créer l'entrée dans la table agencies
    const { data: agencyData, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        user_id: userData.user.id,
        agency_name: payload.agency_name,
        slug: payload.slug,
        license_number: payload.license_number,
        contact_email: payload.contact_email,
        contact_phone: payload.contact_phone,
        address: payload.address,
        city: payload.city,
        postal_code: payload.postal_code,
        logo_url: payload.logo_url,
        primary_color: payload.primary_color,
        secondary_color: payload.secondary_color,
        admin_name: payload.admin_name,
        admin_email: payload.admin_email,
        admin_phone: payload.admin_phone,
        admin_license: payload.admin_license,
        is_active: true,
        must_change_password: true
      })
      .select()
      .single()

    if (agencyError) {
      console.error('Error creating agency:', agencyError)
      // Supprimer l'utilisateur créé si l'agence n'a pas pu être créée
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
      return new Response(
        JSON.stringify({ error: agencyError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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