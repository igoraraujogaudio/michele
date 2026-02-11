import { createClient } from '@/lib/supabase/client';

export function createClientComponentClient() {
  return createClient();
}

export async function signIn(email: string, password: string) {
  const supabase = createClientComponentClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const supabase = createClientComponentClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function signOut() {
  const supabase = createClientComponentClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function resetPassword(email: string) {
  const supabase = createClientComponentClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function updatePassword(newPassword: string) {
  const supabase = createClientComponentClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
