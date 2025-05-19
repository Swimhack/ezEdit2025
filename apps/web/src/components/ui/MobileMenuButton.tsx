interface Props {
  onClick: () => void;
}

export default function MobileMenuButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="sm:hidden p-3 rounded-lg hover:bg-zinc-100 focus:outline-none"
      aria-label="Open sidebar"
      type="button"
    >
      <svg className="w-6 h-6" aria-hidden="true" focusable="false">
        <use href="#icon-menu" />
      </svg>
    </button>
  );
} 