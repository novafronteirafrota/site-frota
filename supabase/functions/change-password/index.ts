import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { target_user_id, new_password } = await req.json();

    // Validate input
    if (!target_user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: 'target_user_id e new_password são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User changing their own password
    if (caller.id === target_user_id) {
      console.log(`User ${caller.id} changing their own password`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        target_user_id,
        { password: new_password }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao alterar senha' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin/Moderator changing another user's password - check roles
    const { data: callerRoleData, error: callerRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (callerRoleError) {
      console.error('Error fetching caller role:', callerRoleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerRole = callerRoleData?.role || 'member';
    console.log(`Caller ${caller.id} has role: ${callerRole}`);

    if (callerRole !== 'admin' && callerRole !== 'moderator') {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para alterar senha de outros usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check target user's role
    const { data: targetRoleData, error: targetRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', target_user_id)
      .maybeSingle();

    if (targetRoleError) {
      console.error('Error fetching target role:', targetRoleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar usuário alvo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetRole = targetRoleData?.role || 'member';
    console.log(`Target ${target_user_id} has role: ${targetRole}`);

    // Enforce hierarchy: Moderators can only change member passwords
    if (callerRole === 'moderator') {
      if (targetRole === 'admin' || targetRole === 'moderator') {
        return new Response(
          JSON.stringify({ error: 'Moderadores só podem alterar senha de membros' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Admin can change anyone's password (except their own through this path, handled above)
    console.log(`${callerRole} ${caller.id} changing password for ${targetRole} ${target_user_id}`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      target_user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao alterar senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
