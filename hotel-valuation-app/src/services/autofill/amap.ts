import type { AmapPoi } from './types';

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: { securityJsCode?: string; serviceHost?: string };
  }
}

let loadPromise: Promise<void> | null = null;
let loadedCredential = '';

const SCRIPT_ID = 'amap-js-api';
const KEY_STORE = 'pamcap.amapKey';
const SECURITY_STORE = 'pamcap.amapSecurityCode';

function readStored(name: string): string {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(name) || '' : '';
}

export function getAmapKey(): string {
  const stored = readStored(KEY_STORE);
  const envKey = (import.meta.env.VITE_AMAP_KEY as string | undefined) || '';
  return (stored && stored.trim()) || envKey;
}

export function getAmapSecurityCode(): string {
  const stored = readStored(SECURITY_STORE);
  const envCode = (import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined) || '';
  return (stored && stored.trim()) || envCode;
}

export function saveAmapCredentials(key: string, securityCode: string): void {
  if (typeof localStorage === 'undefined') return;
  const k = (key || '').trim();
  const s = (securityCode || '').trim();
  if (k) localStorage.setItem(KEY_STORE, k);
  else localStorage.removeItem(KEY_STORE);
  if (s) localStorage.setItem(SECURITY_STORE, s);
  else localStorage.removeItem(SECURITY_STORE);
  loadPromise = null;
  loadedCredential = '';
}

export function loadAmap(key: string, securityCode = ''): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('当前环境不支持加载高德地图。'));
  }
  if (window.AMap) return Promise.resolve();
  if (loadPromise && loadedCredential === key) return loadPromise;

  loadedCredential = key;

  loadPromise = new Promise<void>((resolve, reject) => {
    // 安全密钥必须在加载地图脚本之前设置
    if (securityCode) {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
    }

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

export async function searchHotels(
  keyword: string,
  key: string,
  securityCode = '',
  city?: string,
): Promise<AmapPoi[]> {
  if (!keyword.trim()) throw new Error('请输入酒店名称。');
  if (!key.trim()) throw new Error('未配置高德 Key，请在“设置”中填写。');

  await loadAmap(key, securityCode);

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
        } else if (/USER_SCODE|SECURITY|SCODE/i.test(String(result?.info || status))) {
          reject(new Error('高德安全密钥未配置或不正确，请在“设置”中填写安全密钥。'));
        } else {
          reject(new Error(`高德搜索失败（${status}），请稍后重试或改用手工录入。`));
        }
      });
    } catch (e) {
      reject(e instanceof Error ? e : new Error('高德搜索异常'));
    }
  });
}
