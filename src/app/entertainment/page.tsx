"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { getConfig } from '@/lib/config';
import { searchByKeyword } from '@/lib/api.client';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';
import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';

// Define the correct type for the items returned by the search API
interface ApiSearchResult {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_play_list?: any[];
  source: string;
  source_name: string;
}

// 创建一个映射函数，将 SearchResult 转换为 ApiSearchResult
function mapSearchResultToApiSearchResult(item: any) {
  return {
    vod_id: item.id,
    vod_name: item.title,
    vod_pic: item.poster,
    vod_play_list: item.episodes?.map((episode: string) => ({ episode })) || [],
    source: item.source,
    source_name: item.source_name,
  };
}

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
      try {
        const config = await getConfig();
        console.log('Config loaded:', config);

        // Correctly access the API sites from the config object
        const adultSites = config.SourceConfig
          .filter((site: any) => site.adult)
          .map((site: any) => ({ key: site.key, name: site.name }));

        console.log('Adult sites found:', adultSites);
        setCategories(adultSites);

        if (adultSites.length > 0) {
          setSelectedCategory(adultSites[0].key); // 确保 selectedCategory 被正确初始化
          console.log('Selected Category:', adultSites[0].key); // 打印选中的类别
        } else {
          console.log('No adult sites found in config, using all sites instead');
          // 如果没有找到adult站点，则使用所有站点
          const allSites = config.SourceConfig
            .filter((site: any) => !site.disabled)
            .map((site: any) => ({ key: site.key, name: site.name }));
          console.log('All sites found:', allSites);
          setCategories(allSites);

          if (allSites.length > 0) {
            setSelectedCategory(allSites[0].key);
            console.log('Selected Category (from all sites):', allSites[0].key);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
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
    if (!category) {
      console.log('No category provided for loading videos');
      return;
    }

    console.log(`Loading videos for category: ${category}, page: ${page}`);

    if (page === 1) {
      setLoading(true);
      setVideos([]);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // 尝试使用空关键词搜索，获取所有内容
      const data = await searchByKeyword({ keyword: '', source: category, page });
      console.log('Search Result:', data);

      if (data && Array.isArray(data) && data.length > 0) {
        // 将 SearchResult[] 映射为 ApiSearchResult[]
        const mappedData = data.map(mapSearchResultToApiSearchResult);
        console.log('Mapped data:', mappedData);

        setVideos((prev: ApiSearchResult[]) => (page === 1 ? mappedData : [...prev, ...mappedData]));
        setHasMore(mappedData.length > 0);
        console.log(`Loaded ${mappedData.length} videos`);
      } else if (data && Array.isArray(data) && data.length === 0) {
        // 如果没有数据，尝试使用通用关键词搜索
        console.log('No data with empty keyword, trying with general keyword');
        try {
          const generalData = await searchByKeyword({ keyword: '最新', source: category, page });
          console.log('General search result:', generalData);

          if (generalData && Array.isArray(generalData) && generalData.length > 0) {
            const generalMappedData = generalData.map(mapSearchResultToApiSearchResult);
            setVideos((prev: ApiSearchResult[]) => (page === 1 ? generalMappedData : [...prev, ...generalMappedData]));
            setHasMore(generalMappedData.length > 0);
            console.log(`Loaded ${generalMappedData.length} videos with general keyword`);
          } else {
            console.log('No data found with general keyword either');
            setHasMore(false);
          }
        } catch (generalError) {
          console.error('Error with general keyword search:', generalError);
          setHasMore(false);
        }
      } else {
        console.log('No data returned or data is not an array');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setHasMore(false);
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
      console.log('Selected category changed, loading videos:', selectedCategory);
      setCurrentPage(1);
      loadVideos(selectedCategory, 1);
    } else {
      console.log('No selected category, skipping video load');
    }
  }, [selectedCategory, loadVideos]);

  useEffect(() => {
    if (currentPage > 1) {
      loadVideos(selectedCategory, currentPage);
    }
  }, [currentPage, selectedCategory, loadVideos]);

  useEffect(() => {
    if (!hasMore || isLoadingMore || loading) {
      return;
    }

    if (!loadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage((prev: number) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loading]);

  const getPageTitle = () => '娱乐';

  const getActivePath = () => '/douban?type=entertainment';

  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
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
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-colors duration-200 ${selectedCategory === category.key
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 视频卡片网格 */}
        <div className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8'>
          {loading
            ? skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
            : videos.map((video: ApiSearchResult) => (
              <VideoCard
                id={video.vod_id}
                title={video.vod_name}
                poster={video.vod_pic}
                source={video.source}
                source_name={video.source_name}
                from='search'
                key={`${video.vod_id}-${video.source}`}
              />
            ))}
        </div>

        {/* 加载更多指示器 */}
        {isLoadingMore && (
          <div className='flex justify-center py-6'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
          </div>
        )}

        {/* 无更多内容提示 */}
        {!hasMore && !loading && !isLoadingMore && videos.length > 0 && (
          <div className='text-center py-6 text-gray-500 dark:text-gray-400'>
            没有更多内容了
          </div>
        )}

        {/* 空状态提示 */}
        {!loading && !isLoadingMore && videos.length === 0 && (
          <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
            {categories.length === 0
              ? '未找到资源分类，请检查配置'
              : selectedCategory
                ? `当前分类 "${selectedCategory}" 下暂无内容，请尝试其他分类`
                : '请选择一个分类以浏览内容'}
          </div>
        )}

        {/* 用于无限滚动的观察目标元素 */}
        <div ref={loadingRef} className='h-1' />
      </div>
    </PageLayout>
  );
}

export default function EntertainmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EntertainmentPageClient />
    </Suspense>
  );
}
