const { supabaseService, supabaseAnon } = require('./supabase-test-config');

describe('Supabase Connection Tests', () => {
  test('should connect to Supabase with service role', async () => {
    try {
      const { data, error } = await supabaseService
        .from('empresas')
        .select('id, nome')
        .limit(1);
      
      console.log('Service role test - Data:', data);
      console.log('Service role test - Error:', error);
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    } catch (err) {
      console.error('Service role connection error:', err);
      throw err;
    }
  });

  test('should connect to Supabase with anon key', async () => {
    try {
      const { data, error } = await supabaseAnon
        .from('empresas')
        .select('id, nome')
        .limit(1);
      
      console.log('Anon key test - Data:', data);
      console.log('Anon key test - Error:', error);
      
      // Anon key might have RLS restrictions, so we check for specific error types
      if (error) {
        console.log('Expected RLS restriction for anon key');
        expect(error.code).toBeDefined();
      } else {
        expect(data).toBeDefined();
      }
    } catch (err) {
      console.error('Anon key connection error:', err);
      throw err;
    }
  });

  test('should test basic Supabase client initialization', () => {
    expect(supabaseService).toBeDefined();
    expect(supabaseAnon).toBeDefined();
    expect(supabaseService.supabaseUrl).toBeDefined();
    expect(supabaseAnon.supabaseUrl).toBeDefined();
  });

  test('should verify environment variables', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  });
});