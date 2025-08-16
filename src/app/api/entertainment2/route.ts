import { NextResponse } from 'next/server';

import { getCacheTime } from '@/lib/config';
import { DoubanItem, DoubanResult } from '@/lib/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const pageLimit = parseInt(searchParams.get('limit') || '20');
  const pageStart = parseInt(searchParams.get('start') || '0');
  const categoryId = searchParams.get('t') || ''; // category id
  const page = pageStart / pageLimit + 1;

  const apiUrl = `https://hsckzy888.com/api.php/provide/vod/?ac=videolist&pg=${page}&pagesize=${pageLimit}&t=${categoryId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    interface EntertainmentItem {
      vod_id: { toString: () => string; };
      vod_name: string;
      vod_pic: string;
      vod_score: string;
      vod_year: string;
    }

    const list: DoubanItem[] = data.list.map((item: EntertainmentItem) => ({
      id: item.vod_id.toString(),
      title: item.vod_name,
      poster: item.vod_pic,
      rate: item.vod_score || '',
      year: item.vod_year || '',
      source: 'entertainment2',
    }));

    const responseData: DoubanResult = {
      code: 200,
      message: '获取成功',
      list: list,
    };

    const cacheTime = await getCacheTime();
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取娱乐数据失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}
