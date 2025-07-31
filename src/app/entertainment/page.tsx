import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getConfig } from '@/lib/config';
import { searchByKeyword } from '@/lib/search';
import { mapSearchResultToApiSearchResult } from '@/lib/mappers';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';
import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import { usePageTitle } from '@/hooks/usePageTitle';

function EntertainmentPageClient() {
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [videos, setVideos] = useState<ApiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const config = await getConfig();
      // Correctly access the API sites from the config object
      const adultSites = config.SourceConfig
        .filter((site: any) => site.adult)
        .map((site: any) => ({ key: site.key, name: site.name }));
      setCategories(adultSites);
      if (adultSites.length > 0) {
        setSelectedCategory(adultSites[0].key); // 确保 selectedCategory 被正确初始化
        console.log('Selected Category:', adultSites[0].key); // 打印选中的类别
      }
    };
    fetchCategories();
  }, []);

  // 新增：检查 selectedCategory 是否为空，并在为空时加载默认数据
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].key);
    }
  }, [categories, selectedCategory]);

  const loadVideos = useCallback(async (category: string, page: number) => {
    if (!category) return;
    if (page === 1) {
      setLoading(true);
      setVideos([]);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await searchByKeyword({ keyword: '', source: category, page });
      console.log('Search Result:', data); // 打印搜索结果
      if (data) {
        // 将 SearchResult[] 映射为 ApiSearchResult[]
        const mappedData = data.map(mapSearchResultToApiSearchResult);
        setVideos(prev => (page === 1 ? mappedData : [...prev, ...mappedData]));
        setHasMore(mappedData.length > 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setCurrentPage(1);
      loadVideos(selectedCategory, 1);
    }
  }, [selectedCategory, loadVideos]);

  const apiNames = [
    { name: '首页', path: '/' },
    { name: '搜索', path: '/search' },
    { name: '电影', path: '/movie' },
    { name: '剧集', path: '/tv' },
    { name: '短剧', path: '/short' },
    { name: '综艺', path: '/show' },
    { name: '娱乐', path: '/entertainment' },
  ];

  // 新增：API分类列表
  const apiCategories = [
    { key: 'home', name: '首页', source: 'home' },
    { key: 'search', name: '搜索', source: 'search' },
    { key: 'movie', name: '电影', source: 'movie' },
    { key: 'tv', name: '剧集', source: 'tv' },
    { key: 'short', name: '短剧', source: 'short' },
    { key: 'show', name: '综艺', source: 'show' },
    { key: 'entertainment', name: '娱乐', source: 'entertainment' },
  ];
  // 新增：顶部分类选择
  const [apiCategory, setApiCategory] = useState(apiCategories[0].key);

  // 新增：根据apiCategory切换source
  useEffect(() => {
    // 这里假设 source 与 key 一致
    setSelectedCategory(apiCategory);
  }, [apiCategory]);

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        {/* 新增：顶部分类栏 */}
        <div className="mb-4">
          <span className="font-semibold text-gray-700 mr-2">分类：</span>
          {apiCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setApiCategory(cat.key)}
              className={`px-4 py-2 mx-1 rounded-lg font-semibold transition-colors duration-200 ${apiCategory === cat.key
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 新增：导航栏 */}
        <nav className="mb-6 sm:mb-8">
          <ul className="flex space-x-4">
            {apiNames.map((api) => (
              <li key={api.name}>
                <a href={api.path} className="text-gray-600 hover:text-green-500">
                  {api.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 原有内容保持不变 */}
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          {/* 页面标题和分类选择器 */}
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200'>
              {getPageTitle()}
            </h1>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
              精选资源站
            </p>
          </div>

          {/* 分类选择器 */}
          <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm'>
            <div className="flex flex-wrap gap-4">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${selectedCategory === category.key
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 内容展示区域 */}
        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          {/* 内容网格 */}
          <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
            {loading
              ? skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
              : videos.map((item, index) => (
                <div key={`${item.vod_id}-${index}`} className='w-full'>
                  <VideoCard
                    from='search'
                    id={item.vod_id}
                    source={item.source}
                    title={item.vod_name}
                    poster={item.vod_pic}
                    episodes={item.vod_play_list?.length || 1}
                    source_name={item.source_name}
                    type={(item.vod_play_list?.length || 0) > 1 ? 'tv' : 'movie'}
                  />
                </div>
              ))}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && !loading && (
            <div
              ref={(el) => {
                if (el && el.offsetParent !== null) {
                  (loadingRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
              }}
              className='flex justify-center mt-12 py-8'
            >
              {isLoadingMore && (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-500'></div>
                  <span className='text-gray-600'>加载中...</span>
                </div>
              )}
            </div>
          )}

          {/* 没有更多数据提示 */}
          {!hasMore && videos.length > 0 && (
            <div className='text-center text-gray-500 py-8'>已加载全部内容</div>
          )}

          {/* 空状态 */}
          {!loading && videos.length === 0 && (
            <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default EntertainmentPageClient;
