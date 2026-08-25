'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toastFromError } from '@/lib/notify';
import { api } from '@/shared/api';
import { Button } from '@/components/ui/button';
import { ThemeGallery } from '../theme-gallery';
import type { ShopTheme } from '../theme-gallery.utils';
import {
  AUDIENCE_OPTIONS,
  BRANDING_OPTIONS,
  EMPTY_THEME_PREFERENCES,
  INDUSTRY_OPTIONS,
  PRIORITY_OPTIONS,
  STYLE_OPTIONS,
  THEME_RECOMMEND_STORAGE_KEY,
  type ThemePreferencesDraft,
  type ThemeRecommendationRow,
  type ThemeRecommendStepId,
} from './constants';
import { ThemeOptionGrid } from './theme-option-grid';
import { ThemeRecommendProgress } from './theme-recommend-progress';
import { ThemeRecommendResults } from './theme-recommend-results';

type ThemeRecommendFlowProps = {
  themes: ShopTheme[];
  activeThemeId: string;
  savingThemeId: string | null;
  onSelectTheme: (theme: ShopTheme) => void | Promise<void>;
};

type QuestionStep = {
  id: Exclude<
    ThemeRecommendStepId,
    'intro' | 'results' | 'gallery'
  >;
  title: string;
  description: string;
  field: keyof ThemePreferencesDraft;
  options: typeof INDUSTRY_OPTIONS;
  multi: boolean;
  optional?: boolean;
};

function loadStoredPreferences(): ThemePreferencesDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(THEME_RECOMMEND_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThemePreferencesDraft;
    return {
      industries: parsed.industries ?? [],
      styles: parsed.styles ?? [],
      audiences: parsed.audiences ?? [],
      priorities: parsed.priorities ?? [],
      brandingLevel: parsed.brandingLevel,
    };
  } catch {
    return null;
  }
}

function persistPreferences(prefs: ThemePreferencesDraft) {
  try {
    sessionStorage.setItem(THEME_RECOMMEND_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

export function ThemeRecommendFlow({
  themes,
  activeThemeId,
  savingThemeId,
  onSelectTheme,
}: ThemeRecommendFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<ThemeRecommendStepId>('intro');
  const [prefs, setPrefs] = useState<ThemePreferencesDraft>(
    EMPTY_THEME_PREFERENCES,
  );
  const [knownIndustryLabels, setKnownIndustryLabels] = useState<string[]>([]);
  const [skipIndustry, setSkipIndustry] = useState(false);
  const [hintsReady, setHintsReady] = useState(false);
  const [recommendations, setRecommendations] = useState<
    ThemeRecommendationRow[]
  >([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);

  useEffect(() => {
    const stored = loadStoredPreferences();
    if (stored) setPrefs(stored);

    api
      .getThemeRecommendationHints()
      .then((hints) => {
        setSkipIndustry(hints.skipIndustryQuestion);
        setKnownIndustryLabels(hints.knownIndustryLabels);
        if (hints.skipIndustryQuestion && hints.knownIndustries.length > 0) {
          setPrefs((prev) => {
            if (prev.industries.length > 0) return prev;
            return { ...prev, industries: hints.knownIndustries };
          });
        }
      })
      .catch(() => {
        /* hints are optional — questionnaire still works */
      })
      .finally(() => setHintsReady(true));

    api
      .trackThemeRecommendationEvent({ name: 'theme_recommendation_started' })
      .catch(() => undefined);
  }, []);

  const questionSteps = useMemo(() => {
    const steps: QuestionStep[] = [];
    if (!skipIndustry) {
      steps.push({
        id: 'industry',
        title: 'چه محصولاتی می‌فروشید؟',
        description: 'می‌توانید چند مورد را انتخاب کنید.',
        field: 'industries',
        options: INDUSTRY_OPTIONS,
        multi: true,
      });
    }
    steps.push(
      {
        id: 'style',
        title: 'فروشگاهتان چه حسی داشته باشد؟',
        description: 'سبک بصری مورد علاقه‌تان را انتخاب کنید.',
        field: 'styles',
        options: STYLE_OPTIONS,
        multi: true,
      },
      {
        id: 'audience',
        title: 'عمدتاً به چه کسانی می‌فروشید؟',
        description: 'مخاطب اصلی فروشگاه را مشخص کنید.',
        field: 'audiences',
        options: AUDIENCE_OPTIONS,
        multi: true,
      },
      {
        id: 'priority',
        title: 'ویترین روی چه چیزی تمرکز کند؟',
        description: 'اولویت نمایش فروشگاه را بگویید.',
        field: 'priorities',
        options: PRIORITY_OPTIONS,
        multi: true,
      },
      {
        id: 'branding',
        title: 'آیا سبک برند مشخصی دارید؟',
        description: 'اختیاری — می‌توانید رد شوید.',
        field: 'brandingLevel',
        options: BRANDING_OPTIONS,
        multi: false,
        optional: true,
      },
    );
    return steps;
  }, [skipIndustry]);

  const questionIndex = questionSteps.findIndex((q) => q.id === step);
  const currentQuestion =
    questionIndex >= 0 ? questionSteps[questionIndex] : null;

  const selectedForQuestion = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.field === 'brandingLevel') {
      return prefs.brandingLevel ? [prefs.brandingLevel] : [];
    }
    const value = prefs[currentQuestion.field];
    return Array.isArray(value) ? value : [];
  }, [currentQuestion, prefs]);

  const toggleOption = useCallback(
    (id: string) => {
      if (!currentQuestion) return;
      setPrefs((prev) => {
        if (currentQuestion.field === 'brandingLevel') {
          const next = {
            ...prev,
            brandingLevel: prev.brandingLevel === id ? undefined : id,
          };
          persistPreferences(next);
          return next;
        }
        const key = currentQuestion.field;
        const current = prev[key];
        const list = Array.isArray(current) ? current : [];
        const nextList = list.includes(id)
          ? list.filter((v) => v !== id)
          : [...list, id];
        const next = { ...prev, [key]: nextList };
        persistPreferences(next);
        return next;
      });
    },
    [currentQuestion],
  );

  async function runRecommendation(nextPrefs: ThemePreferencesDraft) {
    setLoadingRecommend(true);
    try {
      const result = await api.recommendShopThemes({
        industries: nextPrefs.industries,
        styles: nextPrefs.styles,
        audiences: nextPrefs.audiences,
        priorities: nextPrefs.priorities,
        brandingLevel: nextPrefs.brandingLevel ?? null,
        limit: 3,
      });
      setRecommendations(result.recommendations);
      setStep('results');
    } catch (err) {
      toastFromError(err, 'پیشنهاد تم ساخته نشد');
    } finally {
      setLoadingRecommend(false);
    }
  }

  async function goNext() {
    if (!currentQuestion) return;
    if (selectedForQuestion.length > 0) {
      api
        .trackThemeRecommendationEvent({
          name: 'theme_question_answered',
          payload: {
            question: currentQuestion.id,
            values: selectedForQuestion,
          },
        })
        .catch(() => undefined);
    }

    const isLast = questionIndex === questionSteps.length - 1;
    if (isLast) {
      await runRecommendation(prefs);
      return;
    }
    setStep(questionSteps[questionIndex + 1]!.id);
  }

  function goBack() {
    if (step === 'results') {
      setStep(questionSteps[questionSteps.length - 1]?.id ?? 'intro');
      return;
    }
    if (step === 'gallery') {
      setStep(recommendations.length > 0 ? 'results' : 'intro');
      return;
    }
    if (questionIndex === 0) {
      setStep('intro');
      return;
    }
    if (questionIndex > 0) {
      setStep(questionSteps[questionIndex - 1]!.id);
    }
  }

  function openPreview(themeId: string) {
    api
      .trackThemeRecommendationEvent({
        name: 'theme_recommendation_previewed',
        payload: { themeId },
      })
      .catch(() => undefined);
    router.push(`/shop/appearance/preview/${themeId}?from=recommend`);
  }

  async function selectRecommended(theme: ShopTheme) {
    api
      .trackThemeRecommendationEvent({
        name: 'theme_recommendation_selected',
        payload: { themeId: theme.id },
      })
      .catch(() => undefined);
    await onSelectTheme(theme);
  }

  function openGallery() {
    api
      .trackThemeRecommendationEvent({
        name: 'theme_gallery_opened_from_recommendation',
      })
      .catch(() => undefined);
    setStep('gallery');
  }

  if (!hintsReady) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-3)]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        در حال آماده‌سازی پیشنهاد تم…
      </div>
    );
  }

  if (step === 'gallery') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">گالری تم‌ها</h2>
            <p className="text-sm text-[var(--text-3)]">
              همه تم‌ها را ببینید یا به پیشنهادهای شخصی‌سازی‌شده برگردید.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('intro')}>
              شروع دوباره پیشنهاد
            </Button>
            {recommendations.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep('results')}>
                بازگشت به پیشنهادها
              </Button>
            ) : null}
          </div>
        </div>
        <ThemeGallery
          themes={themes}
          activeThemeId={activeThemeId}
          savingThemeId={savingThemeId}
          onSelectTheme={onSelectTheme}
        />
      </div>
    );
  }

  if (step === 'results') {
    if (loadingRecommend) {
      return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-3)]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          در حال تحلیل سلیقه فروشگاه شما…
        </div>
      );
    }
    return (
      <ThemeRecommendResults
        recommendations={recommendations}
        activeThemeId={activeThemeId}
        savingThemeId={savingThemeId}
        onPreview={openPreview}
        onSelect={selectRecommended}
        onBrowseAll={openGallery}
        onEditAnswers={() =>
          setStep(questionSteps[0]?.id ?? 'style')
        }
      />
    );
  }

  if (step === 'intro') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-500)]/10 text-[var(--brand-500)]">
          <Sparkles className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[var(--text-1)]">
            ظاهر مناسب فروشگاهتان را پیدا کنیم
          </h2>
          <p className="text-sm leading-7 text-[var(--text-3)]">
            چند سؤال کوتاه می‌پرسیم تا تم‌هایی را پیشنهاد دهیم که با سبک کسب‌وکار
            شما هم‌خوان باشند — نه اینکه مجبور باشید همه تم‌ها را مرور کنید.
          </p>
        </div>
        {skipIndustry && knownIndustryLabels.length > 0 ? (
          <p className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-2)]">
            می‌دانیم محصولات شما نزدیک به{' '}
            <span className="font-medium text-[var(--text-1)]">
              {knownIndustryLabels.join('، ')}
            </span>{' '}
            است. برویم سراغ حس و سبک ویترین.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => setStep(questionSteps[0]?.id ?? 'style')}
          >
            شروع
            <ArrowLeft className="me-1 h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={openGallery}>
            مشاهده همه تم‌ها
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const canContinue =
    currentQuestion.optional || selectedForQuestion.length > 0;
  const isLastQuestion = questionIndex === questionSteps.length - 1;

  return (
    <div className="space-y-6">
      <ThemeRecommendProgress
        current={questionIndex + 1}
        total={questionSteps.length}
      />

      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-[var(--text-1)]">
          {currentQuestion.title}
        </h2>
        <p className="text-sm text-[var(--text-3)]">
          {currentQuestion.description}
        </p>
      </div>

      <ThemeOptionGrid
        options={currentQuestion.options}
        selected={selectedForQuestion}
        multi={currentQuestion.multi}
        onToggle={toggleOption}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack}>
          <ArrowRight className="ms-1 h-4 w-4" aria-hidden />
          بازگشت
        </Button>
        <div className="flex gap-2">
          {currentQuestion.optional ? (
            <Button
              type="button"
              variant="ghost"
              disabled={loadingRecommend}
              onClick={() => void goNext()}
            >
              رد کردن
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!canContinue || loadingRecommend}
            onClick={() => void goNext()}
          >
            {loadingRecommend ? (
              <>
                <Loader2 className="ms-1 h-4 w-4 animate-spin" aria-hidden />
                در حال پیشنهاد…
              </>
            ) : isLastQuestion ? (
              'مشاهده پیشنهادها'
            ) : (
              <>
                ادامه
                <ArrowLeft className="me-1 h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
