import { NAV_ITEMS } from '@/lib/navigation';
import type { Page } from '@/types';

interface BottomNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNav({ page, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/45 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(26,27,30,0.055)] backdrop-blur-2xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                title={item.label}
                className={`flex h-12 w-full items-center justify-center transition-colors duration-200 ${
                  active ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
