import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { CategoryType, SkuOption } from '../types';
import { CATEGORIES, SKU_OPTIONS } from '../constants';
import { Search, Camera, ChevronRight, Check } from 'lucide-react';

// Steps: 0 = Category, 1 = Details, 2 = Price/Finish
export const Sell: React.FC = () => {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<CategoryType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSku, setSelectedSku] = useState<SkuOption | null>(null);
  
  // Handlers
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(0, prev - 1));

  // Rich Dropdown Logic
  const filteredSkus = searchQuery.length > 0 
    ? SKU_OPTIONS.filter(sku => 
        sku.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
        sku.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-2">
            {[0, 1, 2].map((s) => (
                <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                        ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {step > s ? <Check className="w-5 h-5" /> : s + 1}
                    </div>
                    {s < 2 && (
                        <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all duration-500 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 transition-all">
            
            {/* Step 1: Category Selection */}
            {step === 0 && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 break-keep">어떤 상품을 내놓으시겠어요?</h2>
                    <p className="text-gray-500 mb-8">가장 잘 어울리는 카테고리를 선택해주세요.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { type: CategoryType.DIGITAL, label: '디지털/가전', desc: '스마트폰, 노트북' },
                            { type: CategoryType.TICKET, label: '티켓/교환권', desc: '콘서트, 스포츠' },
                            { type: CategoryType.APPLIANCES, label: '생활용품', desc: '가구, 인테리어' },
                        ].map((cat) => (
                            <button
                                key={cat.type}
                                onClick={() => {
                                    setSelectedType(cat.type);
                                    handleNext();
                                }}
                                className="group flex flex-col items-start p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all duration-200 text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600 font-bold">
                                    {cat.label[0]}
                                </div>
                                <span className="font-bold text-gray-900 group-hover:text-indigo-700">{cat.label}</span>
                                <span className="text-xs text-gray-400 mt-1">{cat.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Information Entry (Gamified) */}
            {step === 1 && (
                <div className="animate-fade-in space-y-6">
                     <button onClick={handleBack} className="text-sm text-gray-400 hover:text-gray-800 flex items-center gap-1 mb-2">
                         <ChevronRight className="w-4 h-4 rotate-180" /> 뒤로가기
                     </button>
                    
                    {/* Dynamic Header based on Type */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {selectedType === CategoryType.TICKET ? '티켓 정보를 알려주세요' : '상세 스펙 입력'}
                        </h2>
                        <p className="text-gray-500 text-sm">정확한 정보는 판매 확률을 높여줍니다.</p>
                    </div>

                    {/* Image Upload Mock */}
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        <button className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors bg-gray-50 hover:bg-white">
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">사진 추가</span>
                        </button>
                    </div>

                    {/* Scenario A: Rich Autocomplete for Digital */}
                    {selectedType === CategoryType.DIGITAL && (
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">모델명 검색</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="예: 아이폰 15 Pro, 갤럭시 S24"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            
                            {/* Rich Dropdown */}
                            {filteredSkus.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-up">
                                    <div className="p-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wide">추천 모델</div>
                                    {filteredSkus.map((sku) => (
                                        <button 
                                            key={sku.id}
                                            onClick={() => {
                                                setSelectedSku(sku);
                                                setSearchQuery(`${sku.brand} ${sku.model}`);
                                            }}
                                            className="w-full p-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors text-left"
                                        >
                                            <img src={sku.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover bg-white border border-gray-100" />
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{sku.model}</div>
                                                <div className="text-xs text-gray-500">{sku.brand} • {Object.values(sku.specs).join('/')}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scenario B: Ticket Form */}
                    {selectedType === CategoryType.TICKET && (
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">공연/경기명</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none placeholder:text-gray-300" placeholder="예: 2024 임영웅 콘서트" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">일시</label>
                                <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-gray-600" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">등급 (Grade)</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-white text-gray-600">
                                    <option>VIP석</option>
                                    <option>R석</option>
                                    <option>S석</option>
                                    <option>A석</option>
                                    <option>일반석</option>
                                </select>
                             </div>
                             {/* Visual Seat Picker Mock */}
                             <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 mt-2">
                                <div className="text-xs text-gray-400 font-medium">좌석 구역을 선택해주세요</div>
                                <div className="flex gap-2">
                                    {['A구역', 'B구역', 'C구역', '플로어'].map(zone => (
                                        <button key={zone} className="px-3 py-1 rounded bg-white border border-gray-200 text-sm hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                                            {zone}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}

                    <div className="pt-4">
                         <button 
                            onClick={handleNext}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all transform hover:scale-[1.01]"
                        >
                            다음 단계로
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Finish */}
            {step === 2 && (
                <div className="animate-fade-in text-center py-10">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">판매를 시작할까요?</h2>
                    <p className="text-gray-500 mb-8 break-keep">등록 즉시 수천 명의 프리미엄 구매자에게 노출됩니다.</p>
                    <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
                        상품 등록 완료
                    </button>
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};