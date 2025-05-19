export function FileBrowser() {
  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="px-4 py-2 bg-[#23272f] border-b border-gray-800 text-xs text-gray-200">
        <span className="font-bold text-[#2F65F9]">/</span> eastgateministries.com <span className="mx-1">/</span> httpdocs <span className="mx-1">/</span> index.html
      </div>
      {/* FTP Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="text-sm">
          <li className="mb-1">
            <span className="font-bold text-[#2F65F9]">httpdocs/</span>
            <ul className="ml-4">
              <li className="text-white">index.html</li>
              <li className="text-white">about.html</li>
              <li className="text-white">contact.html</li>
              <li className="text-white">/assets</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
} 