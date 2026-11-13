import { NAV_ITEMS } from '@/lib/navigation';
import type { Page } from '@/types';

interface SideNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

export function SideNav({ page, onNavigate }: SideNavProps) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-fog-200 bg-paper-100/80 px-6 py-10 backdrop-blur-md lg:flex">
      <div className="px-3">
        <p className="font-serif text-4xl leading-none text-charcoal-900">I</p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-500">A quiet place to be yourself.</p>
      </div>

      <nav aria-label="Main" className="mt-12 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition duration-200 ${
                active
                  ? 'bg-fog-200/70 font-medium text-charcoal-900'
                  : 'text-charcoal-500 hover:bg-fog-100 hover:text-charcoal-900'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
