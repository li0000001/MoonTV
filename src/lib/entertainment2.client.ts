import { DoubanResult } from './types';

interface Entertainment2DataParams {
  limit?: number;
  start?: number;
  t?: number;
}

export async function getEntertainment2Data(
  params: Entertainment2DataParams
): Promise<DoubanResult> {
  const { limit = 20, start = 0, t = '' } = params;
  const response = await fetch(
    `/api/entertainment2?limit=${limit}&start=${start}&t=${t}`
  );

  if (!response.ok) {
    throw new Error('获取娱乐数据失败');
  }

  return response.json();
}
