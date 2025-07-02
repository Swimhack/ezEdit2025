import { supabaseClient, createSupabaseClient } from '../src';

describe('supabase-client package', () => {
  it('exports a default supabaseClient instance', () => {
    expect(supabaseClient).toBeDefined();
    // basic sanity check – the "from" method should exist
    expect(typeof supabaseClient.from).toBe('function');
  });

  it('can create a service-role client without throwing', () => {
    expect(() =>
      createSupabaseClient({ role: 'service', serviceKey: 'dummy-key' })
    ).not.toThrow();
  });
});
