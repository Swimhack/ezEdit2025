import sinon from 'sinon';
import { supa } from '../../src/lib/supa';

export const supaStub = () => {
  const sandbox = sinon.createSandbox();

  // Stub the table insert/select calls you need
  sandbox.stub(supa, 'from').returns({
    insert: sandbox.stub().resolves({ error: null }),
    select: sandbox.stub().resolves({ data: null, error: null }),
    single: sandbox.stub().resolves({ data: null, error: null }),
    eq:     () => ({ select: () => ({ single: async () => ({ data: null }) }) }),
  } as any);

  return () => sandbox.restore();
}; 