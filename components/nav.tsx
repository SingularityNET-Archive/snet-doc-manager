import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useMyVariable } from '../context/MyVariableContext';
import { saveUser } from '../utils/saveUser'

type RoleData = {
  roles: {
    [key: string]: string;
  };
  userRoles: string[];
  isAdmin: boolean;  
  discordRoles: string[];
  appRole: string;
  username?: string;
};

const Nav = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const { myVariable, setMyVariable } = useMyVariable();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })
    
    return () => subscription.unsubscribe()
  }, [])

  async function signInWithDiscord() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://snet-doc-manager.netlify.app/',
      },
    })
  }
  
  async function signout() {
    const { error } = await supabase.auth.signOut()
  }

  useEffect(() => {
    // Guard clause: return if session is null
    if (!session) return;
  
    saveUsername();
    const userId = session.user.id;
    fetch(`/api/userRoles?userId=${userId}`)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setMyVariable(prevState => ({
          ...prevState,
          roles: data,
          currentUser: session?.user.user_metadata?.full_name
        }));
        setRoleData(prevState => {
          if (prevState) {
            return {
              roles: prevState.roles,
              userRoles: prevState.userRoles,
              isAdmin: data.isAdmin,
              discordRoles: data.discordRoles,
              appRole: data.appRole,
              username: session?.user.user_metadata?.full_name
            };
          } else {
            // Assuming default values for roles and userRoles
            return {
              roles: {},
              userRoles: [],
              isAdmin: data.isAdmin,
              discordRoles: data.discordRoles,
              appRole: data.appRole,
              username: session?.user.user_metadata?.full_name
            };
          }
        });
      })
      .catch((error) => console.error('Error:', error));
  }, [session]);  

  async function saveUsername() {
    const data = await saveUser(session?.user.user_metadata);
  }

  return (
    <nav className="routes">
      <div className="navLeft">
        <Link href="/" className="navitems">
          Home
        </Link>
        {roleData?.appRole == "admin" && (<>
          <Link href='/doc-manager' className="navitems">
            Doc Manager
          </Link>
          {roleData?.appRole == "admin" && roleData?.username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && (
            <Link href='/dev-tools' className="navitems">
              Dev Tools
            </Link>
          )}
        </>
        )}
      </div>
      <div>
        {!session && (
          <button onClick={signInWithDiscord} className="navitems">
            Sign In with Discord
          </button>)}
        {session && (
          <button onClick={signout} className="navitems">
            Sign Out
          </button>)}
      </div>
    </nav>
  );
};

export default Nav;