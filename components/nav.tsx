import Link from 'next/link';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';

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