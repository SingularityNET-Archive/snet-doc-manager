import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";



const Nav = () => {
 

  return (
    <nav className="routes">
      <div className="navLeft">
        <Link href="/" className="navitems">
          Home
        </Link>
      </div>
    </nav>
  );
};

export default Nav;