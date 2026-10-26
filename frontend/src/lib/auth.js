import { api } from './api.js';
import { supabase } from './supabase.js';
import { createAuthService } from './auth-service.js';

export const auth = createAuthService(supabase, api);
