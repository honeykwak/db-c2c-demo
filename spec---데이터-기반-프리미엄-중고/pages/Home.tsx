import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { CategoryNav } from '../components/CategoryNav';
import { ProductCard } from '../components/ProductCard';
import { PRODUCTS } from '../constants';
import { Category } from '../types';
import { Search, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filter Logic mimicking Recursive CTE result filtering
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return PRODUCTS;

    return PRODUCTS.filter(p => {
      // Direct Match
      if (p.categoryId === selectedCategory.id) return true;
      
      // Parent Category Match (Simulating CTE)
      // If user selected 'Digital' (id: 1), show 'Smartphone' (parentId: 1)
      if (selectedCategory.children && selectedCategory.children.some(child => child.id === p.categoryId)) {
        return true;
      }
      
      return false;
    });
  }, [selectedCategory]);

  return (
    <Layout>
      {/* Hero Section - Added pt-24 to push content down below fixed header */}
      <section className="relative bg-white mb-8 border-b border-gray-100 overflow-hidden pt-28 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white pointer-events-none" />
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:w-2/3 lg:w-1/2">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-wide mb-4 animate-fade-in">
              Premium Data Market
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight animate-slide-up">
              데이터로 확인하는 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                투명한 중고거래
              </span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              허위 매물 없는 정확한 스펙, 직관적인 티켓팅 UI.<br className="hidden sm:block"/>
              지금껏 경험하지 못한 거래의 기준을 제안합니다.
            </p>
            
            <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-grow max-w-md">
                <input 
                  type="text" 
                  placeholder="브랜드, 모델명, 아티스트를 검색해보세요" 
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none placeholder:text-gray-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
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

        {/* Product Grid */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory.name : '최신 등록 매물'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              총 {filteredProducts.length}개의 상품이 있습니다.
            </p>
          </div>
          
          <button className="text-sm font-medium text-gray-500 flex items-center gap-1 hover:text-indigo-600 transition-all">
            더보기 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 mt-4">
             <p className="text-gray-400 mb-1">해당 카테고리에 상품이 없습니다.</p>
             <button onClick={() => setSelectedCategory(null)} className="text-indigo-600 font-medium text-sm hover:underline">
               전체 보기
             </button>
          </div>
        )}
      </div>
    </Layout>
  );
};