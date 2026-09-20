import type { AmapPoi } from './types';

declare global {
  interface Window {
    AMap?: any;
  }
}

let loadPromise: Promise<void> | null = null;

const SCRIPT_ID = 'amap-js-api';

export function getAmapKey(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pamcap.amapKey') : null;
  const envKey = (import.meta.env.VITE_AMAP_KEY as string | undefined) || '';
  return (stored && stored.trim()) || envKey;
}

export function saveAmapKey(key: string): void {
  if (typeof localStorage === 'undefined') return;
  if (key && key.trim()) {
    localStorage.setItem('pamcap.amapKey', key.trim());
    loadPromise = null;
  } else {
    localStorage.removeItem('pamcap.amapKey');
  }
}

export function loadAmap(key: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('当前环境不支持加载高德地图。'));
  }
  if (window.AMap) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('高德地图加载失败，请检查 Key 与网络。')));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.PlaceSearch`;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('高德地图加载失败，请检查 Key 与网络。'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function searchHotels(keyword: string, key: string, city?: string): Promise<AmapPoi[]> {
  if (!keyword.trim()) throw new Error('请输入酒店名称。');
  if (!key.trim()) throw new Error('未配置高德 Key，请在“设置”中填写。');

  await loadAmap(key);

  return new Promise<AmapPoi[]>((resolve, reject) => {
    try {
      const placeSearch = new window.AMap.PlaceSearch({
        type: '住宿服务',
        pageSize: 10,
        pageIndex: 1,
        city: city || '',
        citylimit: false,
      });
      placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result?.poiList?.pois) {
          resolve(result.poiList.pois as AmapPoi[]);
        } else if (status === 'no_data') {
          resolve([]);
        } else {
          reject(new Error(`高德搜索失败（${status}），请稍后重试或改用手工录入。`));
        }
      });
    } catch (e) {
      reject(e instanceof Error ? e : new Error('高德搜索异常'));
    }
  });
}
