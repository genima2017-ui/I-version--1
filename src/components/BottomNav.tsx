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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-fog-200 bg-paper-100/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
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
                className={`flex w-full flex-col items-center gap-1 py-3 text-xs transition-colors duration-200 ${
                  active ? 'font-medium text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
