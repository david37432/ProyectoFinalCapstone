export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  return {
    url,
    publishableKey,
    isConfigured: Boolean(url && publishableKey && url.startsWith('http')),
  };
}

export function getSupabaseConfigErrorMessage() {
  return 'Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';
}

export function createFallbackSupabaseClient() {
  const subscription = {
    unsubscribe() {
      return undefined;
    },
  };

  const queryBuilder = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    neq() {
      return this;
    },
    gt() {
      return this;
    },
    gte() {
      return this;
    },
    lt() {
      return this;
    },
    lte() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    single: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
    maybeSingle: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
    then: undefined,
  };

  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: null,
      }),
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: { message: getSupabaseConfigErrorMessage() },
      }),
      signUp: async () => ({
        data: { user: null },
        error: { message: getSupabaseConfigErrorMessage() },
      }),
      signOut: async () => ({
        error: { message: getSupabaseConfigErrorMessage() },
      }),
      updateUser: async () => ({
        data: { user: null },
        error: { message: getSupabaseConfigErrorMessage() },
      }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: { message: getSupabaseConfigErrorMessage() },
      }),
      onAuthStateChange: () => ({
        data: { subscription },
      }),
    },
    from: () => ({
      select: () => queryBuilder,
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
      }),
      eq: () => queryBuilder,
      neq: () => queryBuilder,
      order: () => queryBuilder,
      limit: () => queryBuilder,
      in: () => queryBuilder,
      match: () => queryBuilder,
      maybeSingle: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
      single: async () => ({ data: null, error: { message: getSupabaseConfigErrorMessage() } }),
    }),
  } as any;
}
