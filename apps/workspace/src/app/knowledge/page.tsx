'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

type KnowledgeDoc = {
  id: string;
  docType: string;
  title: string;
  bodyText: string;
  sourceAttribution: string;
  status: string;
  updatedAt: string;
};

type IndexStatus = {
  total: number;
  active: number;
  indexing: number;
  failed: number;
  mode: string;
  note: string;
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [index, setIndex] = useState<IndexStatus | null>(null);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sourceAttribution, setSourceAttribution] = useState('سیاست فروشگاه');
  const [docType, setDocType] = useState<'faq' | 'policy_override'>('faq');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const [list, status] = await Promise.all([
      api.listKnowledgeDocs(),
      api.getKnowledgeIndexStatus(),
    ]);
    setDocs(list);
    setIndex(status);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setBodyText('');
    setSourceAttribution('سیاست فروشگاه');
    setDocType('faq');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await api.updateKnowledgeDoc(editingId, {
          title,
          bodyText,
          sourceAttribution,
          docType,
        });
        setMessage('به‌روزرسانی شد و دوباره ایندکس شد');
      } else {
        await api.createKnowledgeDoc({
          docType,
          title,
          bodyText,
          sourceAttribution,
        });
        setMessage('FAQ ذخیره و ایندکس شد');
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed');
    }
  }

  return (
    <AppShell>
      <h1>دانش فروشگاه</h1>
      <p className="muted">
        FAQ و سیاست‌ها با attribution — ایندکس keyword (Slice 05)
      </p>

      {index && (
        <div className="banner" style={{ marginBottom: 16 }}>
          <strong>وضعیت ایندکس:</strong> {index.note}
          <div className="muted" style={{ fontSize: 13 }}>
            mode={index.mode} · active={index.active} · indexing={index.indexing}{' '}
            · failed={index.failed}
          </div>
        </div>
      )}

      <div className="card">
        <h3>{editingId ? 'ویرایش سند' : 'افزودن FAQ / سیاست'}</h3>
        <form onSubmit={onSubmit}>
          <label>نوع</label>
          <select
            className="input"
            value={docType}
            onChange={(e) =>
              setDocType(e.target.value as 'faq' | 'policy_override')
            }
          >
            <option value="faq">FAQ</option>
            <option value="policy_override">سیاست / override</option>
          </select>
          <label>عنوان</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label>متن</label>
          <textarea
            className="input"
            style={{ minHeight: 100 }}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            required
          />
          <label>منبع (source attribution)</label>
          <input
            className="input"
            value={sourceAttribution}
            onChange={(e) => setSourceAttribution(e.target.value)}
            required
          />
          <div className="row">
            <button className="btn" type="submit">
              {editingId ? 'ذخیره' : 'افزودن'}
            </button>
            {editingId && (
              <button
                className="btn secondary"
                type="button"
                onClick={resetForm}
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>اسناد</h3>
        {docs.length === 0 && (
          <p className="muted">سندی نیست — دمو معمولاً دو FAQ پیش‌فرض دارد.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            style={{
              borderBottom: '1px solid var(--border)',
              padding: '12px 0',
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>
                {d.title}{' '}
                <span className="muted" style={{ fontWeight: 400 }}>
                  ({d.docType} · {d.status})
                </span>
              </strong>
              <div className="row">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setEditingId(d.id);
                    setTitle(d.title);
                    setBodyText(d.bodyText);
                    setSourceAttribution(d.sourceAttribution);
                    setDocType(
                      d.docType === 'policy_override'
                        ? 'policy_override'
                        : 'faq',
                    );
                  }}
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={async () => {
                    await api.deleteKnowledgeDoc(d.id);
                    await refresh();
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
            <p style={{ margin: '8px 0' }}>{d.bodyText}</p>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              منبع: {d.sourceAttribution}
            </p>
          </div>
        ))}
      </div>

      {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
    </AppShell>
  );
}
