import { DoubanResult } from './types';

interface Entertainment3DataParams {
  limit?: number;
  start?: number;
  t?: number;
}

export async function getEntertainment3Data(
  params: Entertainment3DataParams
): Promise<DoubanResult> {
  const { limit = 20, start = 0, t = '' } = params;
  const response = await fetch(
    `/api/entertainment3?limit=${limit}&start=${start}&t=${t}`
  );

  if (!response.ok) {
    throw new Error('获取娱乐数据失败');
  }

  return response.json();
}
