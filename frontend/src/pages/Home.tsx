import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { CategoryNav } from '../components/CategoryNav';
import { ProductCard } from '../components/ProductCard';
// import { PRODUCTS } from '../constants'; // Removed Mock
import { Category } from '../types';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { api, endpoints } from '../api';
import { mapItemToProduct } from '../utils/dataMapper';
import { Product } from '../types';

export const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [seatSector, setSeatSector] = useState<string | null>(null);

  // Fetch Real Data
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Build query params
        const params: any = {};
        if (selectedCategory) {
          params.category = selectedCategory.id;
        }
        if (searchTerm) {
          params.search = searchTerm;
        }
        if (seatSector) {
          params.seat_sector = seatSector;
        }

        const res = await api.get(endpoints.items, { params });
        const mapped = res.data.map(mapItemToProduct);
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to load items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedCategory, searchTerm, seatSector]);

  // Reset Filters when category changes
  useEffect(() => {
    setSeatSector(null);
  }, [selectedCategory]); // Refund when category or search changes

  // Filter Logic (Client-side redundant if Server does it, but keeping hybrid for now)
  // Actually, server handles category filter now via params.category

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-white mb-8 border-b border-gray-100 overflow-hidden pt-28 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:w-2/3 lg:w-1/2">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-wide mb-4 animate-fade-in">
              Premium Data Market
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight animate-slide-up">
              데이터로 확인하는 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                투명한 중고거래
              </span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              허위 매물 없는 정확한 스펙, 직관적인 티켓팅 UI.<br className="hidden sm:block" />
              지금껏 경험하지 못한 거래의 기준을 제안합니다.
            </p>

            <div className="max-w-prose w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="브랜드, 모델명(예: S24), 아티스트를 검색해보세요"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base outline-none placeholder:text-gray-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 mt-3 pl-2 flex items-center gap-1">
                <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">TIP</span>
                모델명(예: S24)으로 검색하면 <strong>제목에 없어도</strong> 찾아줍니다. (SKU기반 검색 시연)
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Navigation */}
        <CategoryNav
          selectedId={selectedCategory?.id || null}
          onSelect={setSelectedCategory}
        />

        {/* JSONB Tech Demo: Seat Filter */}
        {selectedCategory && ['3', '7', '8', '9'].includes(selectedCategory.id) && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">JSONB Tech Demo</span>
              <span className="text-sm text-gray-600 font-medium">좌석 구역 필터링 (스키마 변경 없이 JSON 내부 쿼리)</span>
            </div>
            <div className="flex gap-2">
              {['A', 'B', 'C', 'VIP'].map(sector => (
                <button
                  key={sector}
                  onClick={() => setSeatSector(seatSector === sector ? null : sector)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors
                                ${seatSector === sector ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'}`}
                >
                  {sector}구역
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory.name : '최신 등록 매물'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? '데이터를 불러오는 중...' : `총 ${products.length}개의 상품이 있습니다.`}
            </p>
          </div>

          <button className="text-sm font-medium text-gray-500 flex items-center gap-1 hover:text-indigo-600 transition-all">
            더보기 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 mt-4">
            <p className="text-gray-400 mb-1">해당 카테고리에 상품이 없습니다.</p>
            <button onClick={() => { setSelectedCategory(null); setSearchTerm('') }} className="text-indigo-600 font-medium text-sm hover:underline">
              전체 보기
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};