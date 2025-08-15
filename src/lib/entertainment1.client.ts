import { DoubanResult } from './types';

interface Entertainment1DataParams {
  limit?: number;
  start?: number;
  t?: number;
}

export async function getEntertainment1Data(
  params: Entertainment1DataParams
): Promise<DoubanResult> {
  const { limit = 20, start = 0, t = '' } = params;
  const response = await fetch(
    `/api/entertainment1?limit=${limit}&start=${start}&t=${t}`
  );

  if (!response.ok) {
    throw new Error('获取娱乐数据失败');
  }

  return response.json();
}
