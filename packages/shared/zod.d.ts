export declare const SiteSchema: any;
export declare const FileMetaSchema: any;
export interface Site {
    id: string;
    owner_id: string;
    name: string;
    host: string;
    username: string;
    password: string;
    root_path: string;
    created_at: string;
}
export interface FileMeta {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    modified?: string;
    children?: FileMeta[];
}
//# sourceMappingURL=zod.d.ts.map