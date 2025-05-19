export class MockFtp {
  public data = new Map<string, Buffer>();

  async connect() {}
  async cd() {}

  async list(root = '/') {
    return [...this.data.keys()].map((name) => ({
      name,
      isDirectory: false,
      size: this.data.get(name)!.length,
      modifiedAt: new Date(),
    }));
  }

  async read(path: string) {
    if (!this.data.has(path)) throw new Error('ENOENT');
    return this.data.get(path)!;
  }

  async write(path: string, contents: string | Buffer) {
    this.data.set(path, Buffer.isBuffer(contents) ? contents : Buffer.from(contents));
  }

  close() {}
} 