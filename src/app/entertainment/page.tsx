/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { searchByKeyword } from '@/lib/api.client';
import { getConfig } from '@/lib/config';

import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

// Define the correct type for the items returned by the search API
interface ApiSearchResult {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_play_list?: any[];
  source: string;
  source_name: string;
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
      const config = await getConfig();
      // Correctly access the API sites from the config object
      const adultSites = config.SourceConfig
        .filter((site: any) => site.adult)
        .map((site: any) => ({ key: site.key, name: site.name }));
      setCategories(adultSites);
      if (adultSites.length > 0) {
        setSelectedCategory(adultSites[0].key);
      }
    };
    fetchCategories();
  }, []);

  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

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
      if (data) {
        setVideos(prev => (page === 1 ? data : [...prev, ...data]));
        setHasMore(data.length > 0);
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
          setCurrentPage((prev) => prev + 1);
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

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200'>
              {getPageTitle()}
            </h1>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
              精选资源站
            </p>
          </div>

          <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm'>
            <div className="flex flex-wrap gap-4">
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                    selectedCategory === category.key
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
            {loading
              ? skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
              : videos.map((item, index) => (
                  <div key={`${item.vod_id}-${index}`} className='w-full'>
                    <VideoCard
                      id={item.vod_id}
                      source={item.source}
                      title={item.vod_name}
                      poster={item.vod_pic}
                      episodes={item.vod_play_list?.length || 1}
                      source_name={item.source_name}
                      type={item.vod_play_list?.length > 1 ? 'tv' : 'movie'}
                    />
                  </div>
                ))}
          </div>

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

          {!hasMore && videos.length > 0 && (
            <div className='text-center text-gray-500 py-8'>已加载全部内容</div>
          )}

          {!loading && videos.length === 0 && (
            <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function EntertainmentPage() {
  return (
    <Suspense>
      <EntertainmentPageClient />
    </Suspense>
  );
}
