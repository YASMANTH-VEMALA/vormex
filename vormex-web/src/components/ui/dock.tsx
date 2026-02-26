'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, Users, Plus, Bell, MessageCircle, Group, MoreHorizontal, Film } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth/useAuth';
import { BottomNavigation } from './BottomNavigation';

// Dynamically import CreatePostModal to avoid circular dependencies
const CreatePostModal = dynamic(() => import('@/components/feed/CreatePostModal'), {
  ssr: false,
});


const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
};

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  width?: MotionValue<number>;
};

type DockContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

type DockProviderProps = {
  children: React.ReactNode;
  value: DockContextType;
};

const DockContext = createContext<DockContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within a DockProvider');
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{
        height: height,
        scrollbarWidth: 'none',
      }}
      className="mx-2 flex max-w-full items-end overflow-x-auto"
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          'mx-auto flex w-fit gap-4 rounded-2xl bg-transparent px-4',
          className
        )}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        <DockProvider value={{ mouseX, spring, distance, magnification }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className, href, isActive }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { distance, magnification, mouseX, spring } = useDock();
  const isHovered = useMotionValue(0);
  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });
  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [40, magnification, 40]
  );
  const width = useSpring(widthTransform, spring);

  const content = (
    <motion.div
      ref={ref}
      style={{ width }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-center',
        isActive && 'ring-2 ring-blue-500 dark:ring-blue-400 rounded-full',
        className
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement<DockIconProps | DockLabelProps>, {
          width,
          isHovered
        } as Partial<DockIconProps & DockLabelProps>)
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center justify-center">
        {content}
      </Link>
    );
  }

  return content;
}

function DockLabel({ children, className, isHovered, ...rest }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white',
            className
          )}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, width, ...rest }: DockIconProps) {
  const defaultWidth = useMotionValue(40);
  const widthValue = width || defaultWidth;
  const widthTransform = useTransform(widthValue, (val) => val / 2);
  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

// Vormex Dock Navigation Component
export function VormexDock() {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  // Hide dock on login, auth, and onboarding pages
  const hideDockPages = ['/login', '/forgot-password', '/reset-password', '/verify-email', '/onboarding'];
  if (hideDockPages.includes(pathname)) {
    return null;
  }

  // Profile picture component
  const ProfilePicture = ({ size = 'full' }: { size?: 'full' | 'small' }) => {
    const sizeClass = size === 'small' ? 'w-6 h-6' : 'h-full w-full';

    if (user?.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.name || 'Profile'}
          className={`${sizeClass} rounded-full object-cover`}
        />
      );
    }

    // Fallback to initials
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center`}>
        <span className={`text-white font-semibold ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    );
  };

  const navItems: Array<{
    title: string;
    href: string;
    icon: React.ReactElement;
    isCreate?: boolean;
    isProfile?: boolean;
    badge?: number;
  }> = [
      {
        title: 'Home',
        href: '/',
        icon: <HomeIcon className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Reels',
        href: '/reels',
        icon: <Film className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Find People',
        href: '/find-people',
        icon: <Users className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Groups',
        href: '/groups',
        icon: <Group className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Create',
        href: '#create',
        icon: <Plus className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
        isCreate: true,
      },
      {
        title: 'Messages',
        href: '/messages',
        icon: <MessageCircle className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: <Bell className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'More',
        href: '/more',
        icon: <MoreHorizontal className="h-full w-full text-neutral-600 dark:text-neutral-300" />,
      },
      {
        title: 'Profile',
        href: '/profile',
        icon: <ProfilePicture />,
        isProfile: true,
      },
    ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '#create') {
      return false;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-transparent rounded-2xl px-4 py-2 shadow-lg">
        <Dock className="items-end pb-3">
          {navItems.map((item) => (
            item.isCreate ? (
              <div
                key={item.href}
                onClick={() => setShowCreateModal(true)}
                className="cursor-pointer"
              >
                <DockItem
                  isActive={false}
                  className="aspect-square rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors"
                >
                  <DockLabel>{item.title}</DockLabel>
                  <DockIcon>
                    <Plus className="h-full w-full text-white" />
                  </DockIcon>
                </DockItem>
              </div>
            ) : item.isProfile ? (
              <DockItem
                key={item.href}
                href={item.href}
                isActive={isActive(item.href)}
                className={`aspect-square rounded-full overflow-hidden ${isActive(item.href)
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900'
                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-neutral-600'
                  } transition-all`}
              >
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>{item.icon}</DockIcon>
              </DockItem>
            ) : (
              <DockItem
                key={item.href}
                href={item.href}
                isActive={isActive(item.href)}
                className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
              >
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>{item.icon}</DockIcon>
              </DockItem>
            )
          ))}
        </Dock>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        className="lg:hidden"
        items={[
          {
            title: 'Home',
            href: '/',
            icon: <HomeIcon className="w-full h-full" />,
            isActive: pathname === '/'
          },
          {
            title: 'Reels',
            href: '/reels',
            icon: <Film className="w-full h-full" />,
            isActive: pathname.startsWith('/reels')
          },
          {
            title: 'Create',
            href: '#create',
            icon: <Plus className="w-full h-full" />,
            isActive: false,
            onClick: () => setShowCreateModal(true)
          },
          {
            title: 'Messages',
            href: '/messages',
            icon: <MessageCircle className="w-full h-full" />,
            isActive: pathname.startsWith('/messages')
          },
          {
            title: 'Profile',
            href: '/profile',
            icon: <ProfilePicture size="small" />,
            isActive: pathname.startsWith('/profile')
          }
        ]}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

    </>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
