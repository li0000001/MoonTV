import { SearchResult } from './types';

export async function searchByKeyword({
  keyword,
  source,
  page = 1,
}: {
  keyword: string;
  source: string | null;
  page?: number;
}): Promise<SearchResult[]> {
  const params = new URLSearchParams();
  if (source) {
    params.set('source', source);
  }
  if (page) {
    params.set('page', String(page));
  }

  const url = `/api/search/${encodeURIComponent(keyword)}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export async function getDetail({
  source,
  id,
}: {
  source: string;
  id: string;
  // 根据 api/detail/route.ts 中的实现，这里应该返回 any 类型
}): Promise<any | null> {
  const params = new URLSearchParams();
  params.set('source', source);
  params.set('id', id);

  const url = `/api/detail?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}