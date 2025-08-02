import { NextResponse } from 'next/server';

import { getAvailableApiSites, getCacheTime } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { keyword: string } }
) {
  const { searchParams } = new URL(request.url);
  const keyword = decodeURIComponent(params.keyword);
  const source = searchParams.get('source');
  const page = searchParams.get('page') || '1';

  console.log(`Search request: keyword="${keyword}", source="${source}", page=${page}`);

  if (!keyword && !source) {
    const cacheTime = await getCacheTime();
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}`,
        },
      }
    );
  }

  try {
    if (source) {
      // 如果指定了source，只从该source搜索
      const apiSites = await getAvailableApiSites();
      const targetSite = apiSites.find((site) => site.key === source);

      if (!targetSite) {
        console.log(`Source "${source}" not found`);
        return NextResponse.json({ results: [] });
      }

      console.log(`Searching in source: ${targetSite.name} with keyword: "${keyword}"`);
      const results = await searchFromApi(targetSite, keyword);
      console.log(`Found ${results.length} results from ${targetSite.name}`);

      const cacheTime = await getCacheTime();
      return NextResponse.json(results, {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}`,
        },
      });
    } else {
      // 如果没有指定source，从所有source搜索
      const apiSites = await getAvailableApiSites();
      const searchPromises = apiSites.map((site) => {
        console.log(`Searching in source: ${site.name} with keyword: "${keyword}"`);
        return searchFromApi(site, keyword);
      });

      const results = await Promise.all(searchPromises);
      const flattenedResults = results.flat();
      console.log(`Found ${flattenedResults.length} total results`);

      const cacheTime = await getCacheTime();
      return NextResponse.json(flattenedResults, {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}`,
        },
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}