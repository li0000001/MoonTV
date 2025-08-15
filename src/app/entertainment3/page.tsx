/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import { Suspense } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getEntertainment3Data } from '@/lib/entertainment3.client';
import { DoubanItem } from '@/lib/types';

import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

function Entertainment3PageClient() {
  const [data, setData] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

  const getRequestParams = useCallback((pageStart: number) => {
    return {
      limit: 25,
      start: pageStart,
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getEntertainment3Data(getRequestParams(0));

      if (result.code === 200) {
        setData(result.list);
        setHasMore(result.list.length === 25);
        setLoading(false);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (err) {
      console.error(err);
    }
  }, [getRequestParams]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (currentPage > 0) {
      const fetchMoreData = async () => {
        try {
          setIsLoadingMore(true);

          const result = await getEntertainment3Data(
            getRequestParams(currentPage * 25)
          );

          if (result.code === 200) {
            setData((prev) => [...prev, ...result.list]);
            setHasMore(result.list.length === 25);
          } else {
            throw new Error(result.message || '获取数据失败');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingMore(false);
        }
      };

      fetchMoreData();
    }
  }, [currentPage, getRequestParams]);

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

  return (
    <PageLayout activePath="/entertainment3">
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200'>
              娱乐中心3
            </h1>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
              来自Yutu资源的精彩内容
            </p>
          </div>
        </div>

        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
            {loading
              ? skeletonData.map((index) => <DoubanCardSkeleton key={index} />)
              : data.map((item, index) => (
                  <div key={`${item.title}-${index}`} className='w-full'>
                    <VideoCard
                      from='search'
                      id={item.id}
                      source={item.source}
                      title={item.title}
                      poster={item.poster}
                      rate={item.rate}
                      year={item.year}
                    />
                  </div>
                ))}
          </div>

          {hasMore && !loading && (
            <div
              ref={(el) => {
                if (el && el.offsetParent !== null) {
                  (
                    loadingRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
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

          {!hasMore && data.length > 0 && (
            <div className='text-center text-gray-500 py-8'>已加载全部内容</div>
          )}

          {!loading && data.length === 0 && (
            <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function Entertainment3Page() {
  return (
    <Suspense>
      <Entertainment3PageClient />
    </Suspense>
  );
}
