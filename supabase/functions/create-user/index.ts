import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { username, password, display_name, role, init_secret } = await req.json();

    // Validate required fields
    if (!username || !password || !display_name) {
      throw new Error("Username, password e display_name são obrigatórios");
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      throw new Error("Username deve ter 3-30 caracteres (letras, números, underscore)");
    }

    // For initial admin creation, use a secret. For regular creation, require auth.
    const authHeader = req.headers.get("Authorization");
    const isInitialSetup = init_secret === "STELLAR_INIT_2024";
    
    if (!isInitialSetup) {
      // Verify caller is admin
      if (!authHeader) {
        throw new Error("Authorization required");
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !callerUser) {
        throw new Error("Invalid authorization");
      }
      
      // Check if caller is admin or moderator
      const { data: callerRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', callerUser.id)
        .single();
      
      if (!callerRole || (callerRole.role !== 'admin' && callerRole.role !== 'moderator')) {
        throw new Error("Insufficient permissions");
      }
      
      // Moderators can only create members
      if (callerRole.role === 'moderator' && role && role !== 'member') {
        throw new Error("Moderators can only create members");
      }
    }

    // Check if username already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("Username já está em uso");
    }

    // Generate a fake email for Supabase Auth (required by Supabase)
    // Using username + domain format for uniqueness
    const fakeEmail = `${username}@stellarorg.local`;

    // Create user via admin API
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name,
      },
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
        throw new Error("Username já está em uso");
      }
      throw createError;
    }

    // If role is specified and not 'member', update the role
    if (role && role !== 'member' && authData.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', authData.user.id);

      if (roleError) {
        console.error('Error updating role:', roleError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
