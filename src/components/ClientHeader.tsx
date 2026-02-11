'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';

export default function ClientHeader() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (!mounted) {
    return null;
  }

  return <Header user={user} />;
}
