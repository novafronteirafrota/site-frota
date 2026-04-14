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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      throw new Error("Invalid authorization");
    }

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id é obrigatório");
    }

    // Prevent self-deletion
    if (callerUser.id === user_id) {
      throw new Error("Você não pode remover a si mesmo");
    }

    // Get caller's role
    const { data: callerRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .single();

    const callerRole = callerRoleData?.role;

    if (!callerRole || (callerRole !== 'admin' && callerRole !== 'moderator')) {
      throw new Error("Permissão insuficiente");
    }

    // Get target user's role
    const { data: targetRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single();

    const targetRole = targetRoleData?.role || 'member';

    // Moderators can only delete members
    if (callerRole === 'moderator' && (targetRole === 'admin' || targetRole === 'moderator')) {
      throw new Error("Moderadores só podem remover membros");
    }

    console.log(`User ${callerUser.id} (${callerRole}) attempting to delete user ${user_id} (${targetRole})`);

    // Delete user's fleet first
    const { error: fleetError } = await supabaseAdmin
      .from('user_fleet')
      .delete()
      .eq('user_id', user_id);

    if (fleetError) {
      console.error('Error deleting user fleet:', fleetError);
      // Continue with deletion even if fleet deletion fails
    }

    // Delete user's role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (roleError) {
      console.error('Error deleting user role:', roleError);
    }

    // Delete user's profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw new Error("Erro ao remover usuário: " + deleteError.message);
    }

    console.log(`User ${user_id} successfully deleted by ${callerUser.id}`);

    return new Response(
      JSON.stringify({ success: true }),
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
