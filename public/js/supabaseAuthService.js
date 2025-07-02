// public/js/supabaseAuthService.js
import { supabase } from './supabaseClient.js';

export async function signInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Sign-in error:', error.message);
        return { success: false, error: error.message };
    }
    console.log('Sign-in successful:', data);
    return { success: true, data: data };
}

export async function signUpUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (error) {
        console.error('Sign-up error:', error.message);
        return { success: false, error: error.message };
    }
    console.log('Sign-up successful:', data);
    return { success: true, data: data };
}

export async function signOutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign-out error:', error.message);
        return { success: false, error: error.message };
    }
    console.log('Sign-out successful');
    return { success: true };
}

export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Get session error:', error.message);
        return null;
    }
    return session;
}

export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Get user error:', error.message);
        return null;
    }
    return user;
}

// Store session in sessionStorage
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        sessionStorage.setItem('supabaseSession', JSON.stringify(session));
    } else {
        sessionStorage.removeItem('supabaseSession');
    }
});
