'use client';

import { createContext, useContext, type ReactNode } from 'react';

type PreviewContextValue = {
  isPreview: boolean;
  previewThemeId: string | null;
};

const PreviewContext = createContext<PreviewContextValue>({
  isPreview: false,
  previewThemeId: null,
});

export function PreviewProvider({
  isPreview,
  previewThemeId,
  children,
}: PreviewContextValue & { children: ReactNode }) {
  return (
    <PreviewContext.Provider value={{ isPreview, previewThemeId }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreviewMode() {
  return useContext(PreviewContext);
}

export function PreviewBanner() {
  const { isPreview } = usePreviewMode();
  if (!isPreview) return null;
  return (
    <div
      className="sticky top-0 z-[100] bg-amber-500 px-4 py-2 text-center text-[13px] font-semibold text-black"
      role="status"
      aria-live="polite"
    >
      حالت پیش‌نمایش — تغییرات ذخیره نمی‌شوند و خرید غیرفعال است
    </div>
  );
}
