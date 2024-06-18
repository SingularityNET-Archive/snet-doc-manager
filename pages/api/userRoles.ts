import { supabase } from "../../lib/supabaseClient";

interface User {
  discord_roles: any; 
  app_role: any;  
  full_name: any;     
}

export default async function handler(req: any, res: any) {
  const { userId } = req.query;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("discord_roles, app_role, full_name")
    .eq("user_id", userId);

  if (userError) {
    return res.status(500).json({ error: userError.message });
  }

  // Extract values from userData array
  let discordRoles = null;
  let appRole = null;
  let isAdmin = false;
  let username = null;
  if (userData && Array.isArray(userData) && userData.length > 0) {
    discordRoles = (userData[0] as User).discord_roles;
    appRole = (userData[0] as User).app_role;
    username = (userData[0] as User).full_name;
    isAdmin = appRole == "admin"? true : false;
  }

  return res.status(200).json({ isAdmin, discordRoles, appRole, username });
}
