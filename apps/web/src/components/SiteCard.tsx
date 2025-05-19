import { Globe, Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Site } from '../stores/sites';

interface Props {
  site: Site;
  onOpen: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function SiteCard({ site, onOpen, onEdit, onDelete }: Props) {
  const protocol = site.secure ? "FTPS" : "FTP";
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(site.id);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(site.id);
  };
  
  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (site.url) {
      window.open(site.url, '_blank');
    }
  };

  return (
    <article
      className="group relative flex h-[220px] flex-col justify-between rounded-xl border bg-white p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => onOpen(site.id)}
    >
      {/* Top row */}
      <header className="flex items-center justify-between">
        <h2 className="truncate text-lg font-semibold">{site.name}</h2>

        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-xs font-medium text-white",
            protocol === "FTP" ? "bg-blue-500" : "bg-green-600"
          )}
        >
          {protocol}
        </span>
      </header>

      {/* Middle: connection details */}
      <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm leading-5">
        <p className="font-mono text-gray-700">
          {site.host}:{site.port || 21}
          <br />
          {site.root || '/'}
        </p>
      </div>

      {/* Bottom actions */}
      <footer className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={handleEdit}
          className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Pencil size={16} />
          Edit
        </button>

        {site.url && (
          <button
            onClick={handleVisit}
            className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
          >
            <Globe size={16} />
            Visit
          </button>
        )}

        {onDelete && (
          <button
            onClick={handleDelete}
            className="ml-auto flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </footer>

      {/* Subtle hover elevation */}
      <span className="absolute inset-0 rounded-xl ring-1 ring-transparent transition group-hover:ring-gray-200" />
    </article>
  );
}