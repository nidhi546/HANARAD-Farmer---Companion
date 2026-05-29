/**
 * useDiseases — fetches the disease catalogue from API with offline fallback.
 *
 * Load order:
 *  1. AsyncStorage cache (TTL 7 days) → instant render, no spinner
 *  2. API: POST /mongo/getdata { moduleName: 'diseases' }
 *  3. Static fallback (diseasesData.js) if both cache and API fail
 *
 * The hook normalises API documents into the same shape the screens expect:
 *   { _id, slug, cropKey, severity, name, symptoms, treatments, medicines,
 *     prevention, imageUrl, isActive }
 *
 * Language resolution is done inside the hook based on current language:
 *   disease.name      → resolved string  (not object)
 *   disease.symptoms  → resolved string
 *   disease.treatments → resolved array
 *   disease.prevention → resolved string
 *
 * This means screens don't need to know about { en, hi, gu } — they get
 * a flat object ready to render.
 */
import { useState, useEffect, useCallback } from 'react';
import { getDiseasesBundleApi }              from '../api/diseaseApi';
import { DISEASES as OFFLINE_DISEASES }      from '../constants/diseasesData';
import { Storage, KEYS }                     from '../utils/storage';
import { useLanguage }                        from '../context/LanguageContext';

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Convert API document → flat display object ─────────────────────────────
function resolveDisease(doc, lang) {
  const l = ['en', 'hi', 'gu', 'tl'].includes(lang) ? lang : 'en';

  const name       = typeof doc.name       === 'object' ? (doc.name[l]       || doc.name.en       || '') : (doc.name       || '');
  const symptoms   = typeof doc.symptoms   === 'object' ? (doc.symptoms[l]   || doc.symptoms.en   || '') : (doc.symptoms   || '');
  const prevention = typeof doc.prevention === 'object' ? (doc.prevention[l] || doc.prevention.en || '') : (doc.prevention || '');

  let treatments = [];
  if (Array.isArray(doc.treatments)) {
    treatments = doc.treatments;
  } else if (doc.treatments && typeof doc.treatments === 'object') {
    treatments = doc.treatments[l] || doc.treatments.en || [];
  }

  return {
    _id:        doc._id        ?? doc.id ?? null,
    slug:       doc.slug       ?? doc.id ?? null,
    cropKey:    doc.cropKey    ?? doc.crop ?? 'unknown',
    severity:   doc.severity   ?? 'medium',
    sortOrder:  doc.sortOrder  ?? 0,
    imageUrl:   doc.imageUrl   ?? null,
    medicines:  Array.isArray(doc.medicines) ? doc.medicines : [],
    aiLabels:   Array.isArray(doc.aiLabels)  ? doc.aiLabels  : [],
    name,
    symptoms,
    treatments,
    prevention,
  };
}

// ── Convert static diseasesData.js entry → same flat shape ─────────────────
function resolveOfflineDisease(d, lang) {
  const name       = lang === 'gu' ? (d.nameGu || d.name) : lang === 'hi' ? (d.nameHi || d.name) : d.name;
  const symptoms   = lang === 'gu' ? (d.symptomsGu || d.symptoms) : lang === 'hi' ? (d.symptomsHi || d.symptoms) : d.symptoms;
  const treatments = lang === 'gu' ? (d.treatmentsGu || d.treatments) : d.treatments;
  const prevention = d.prevention || '';

  return {
    _id:        null,
    slug:       d.id,
    cropKey:    d.crop,
    severity:   d.severity   ?? 'medium',
    sortOrder:  0,
    imageUrl:   null,
    medicines:  d.medicines  ?? [],
    aiLabels:   [],
    name,
    symptoms,
    treatments,
    prevention,
  };
}

export function useDiseases() {
  const { language }      = useLanguage();
  const [rawData, setRawData] = useState([]);   // raw API/cache documents
  const [loading, setLoading] = useState(true);
  const [source,  setSource]  = useState(null); // 'api' | 'cache' | 'offline'

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // ── 1. Fresh cache ─────────────────────────────────────────────────
      if (!forceRefresh) {
        const cached = await Storage.get(KEYS.DISEASE_CACHE);
        if (cached?.data?.length && Date.now() - cached.timestamp < CACHE_TTL) {
          setRawData(cached.data);
          setSource('cache');
          setLoading(false);
          refreshInBackground();
          return;
        }
      }

      // ── 2. API ─────────────────────────────────────────────────────────
      const remote = await getDiseasesBundleApi();
      if (remote.length > 0) {
        setRawData(remote);
        setSource('api');
        await Storage.set(KEYS.DISEASE_CACHE, { data: remote, timestamp: Date.now() });
        return;
      }

      // ── 3. Stale cache ─────────────────────────────────────────────────
      const stale = await Storage.get(KEYS.DISEASE_CACHE);
      if (stale?.data?.length) {
        setRawData(stale.data);
        setSource('cache');
        return;
      }

      // ── 4. Static offline bundle ───────────────────────────────────────
      setRawData(OFFLINE_DISEASES);
      setSource('offline');
    } catch {
      const stale = await Storage.get(KEYS.DISEASE_CACHE);
      if (stale?.data?.length) {
        setRawData(stale.data);
        setSource('cache');
      } else {
        setRawData(OFFLINE_DISEASES);
        setSource('offline');
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshInBackground() {
    getDiseasesBundleApi().then(async (remote) => {
      if (remote.length > 0) {
        setRawData(remote);
        setSource('api');
        await Storage.set(KEYS.DISEASE_CACHE, { data: remote, timestamp: Date.now() });
      }
    }).catch(() => {});
  }

  useEffect(() => { load(); }, [load]);

  // Resolve language on every rawData or language change
  const diseases = rawData.map((d) =>
    // Offline fallback documents have different shape (no nested { en, hi, gu })
    source === 'offline'
      ? resolveOfflineDisease(d, language)
      : resolveDisease(d, language),
  );

  return {
    diseases,
    loading,
    source,
    refreshDiseases: () => load(true),
  };
}
