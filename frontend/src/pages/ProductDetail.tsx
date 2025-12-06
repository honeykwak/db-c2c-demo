import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
// import { PRODUCTS } from '../constants';
import { CategoryType, TicketDetails, DeviceDetails, Product } from '../types';
import { ArrowLeft, Share2, MoreHorizontal, MapPin, Calendar, CheckCircle2, ShieldCheck, MessageCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { api, endpoints } from '../api';
import { mapItemToProduct } from '../utils/dataMapper';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(`${endpoints.items}/${id}`);
        setProduct(mapItemToProduct(res.data));
      } catch (err) {
        console.error("Failed to fetch details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="h-screen flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="p-10 text-center pt-24">상품을 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  const isTicket = product.category === CategoryType.TICKET;
  const ticketInfo = isTicket ? (product.details as TicketDetails) : null;
  const deviceInfo = !isTicket ? (product.details as DeviceDetails) : null;


  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        {/* Breadcrumb / Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium">
            <ArrowLeft className="w-5 h-5 mr-1" />
            목록으로
          </Link>
          <div className="flex gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-200 shadow-sm transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full border border-gray-200 shadow-sm transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] lg:aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-inner">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Info (Sticky on Desktop) */}
          <div className="lg:sticky lg:top-24 h-fit space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-gray-900 text-white text-xs font-bold tracking-wide">
                  {isTicket ? '검증된 티켓' : '검수 완료 기기'}
                </span>
                <span className="text-gray-400 text-sm">2시간 전 등록</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2 break-keep">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                {product.price.toLocaleString()}원
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SCENARIO D: Visual Ticket UI */}
            {isTicket && ticketInfo && (
              <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Decorative Ticket Punch */}
                <div className="absolute top-1/2 left-0 w-4 h-8 bg-gray-50 rounded-r-full -translate-y-1/2 border-y border-r border-gray-200"></div>
                <div className="absolute top-1/2 right-0 w-4 h-8 bg-gray-50 rounded-l-full -translate-y-1/2 border-y border-l border-gray-200"></div>
                <div className="absolute top-1/2 left-4 right-4 h-px border-t-2 border-dashed border-gray-200 -z-10"></div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Event</p>
                      <h3 className="font-bold text-lg text-gray-900">{ticketInfo.artist}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-md text-xs font-bold border ${ticketInfo.grade === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                      {ticketInfo.grade}석
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">일시</span>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatDate(ticketInfo.date)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(ticketInfo.date)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">장소</span>
                      </div>
                      <p className="font-semibold text-sm line-clamp-2">{ticketInfo.venue}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-lg">
                    <div className="text-center w-1/3">
                      <p className="text-[10px] opacity-60 uppercase">구역 (Sector)</p>
                      <p className="font-bold text-lg truncate px-1">{ticketInfo.sector}</p>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div className="text-center w-1/3">
                      <p className="text-[10px] opacity-60 uppercase">열 (Row)</p>
                      <p className="font-bold text-lg">{ticketInfo.row}</p>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div className="text-center w-1/3">
                      <p className="text-[10px] opacity-60 uppercase">번 (Seat)</p>
                      <p className="font-bold text-lg">{ticketInfo.number}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCENARIO A: Standard Product Specs */}
            {!isTicket && deviceInfo && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  상세 스펙 정보
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="block text-gray-400 text-xs mb-1">브랜드</span>
                    <span className="font-medium text-gray-900">{deviceInfo.brand}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs mb-1">모델명</span>
                    <span className="font-medium text-gray-900">{deviceInfo.model}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs mb-1">상태</span>
                    <span className={`inline-flex items-center gap-1 font-medium ${deviceInfo.condition === 'New' ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {deviceInfo.condition === 'New' ? '미개봉 새상품' :
                        deviceInfo.condition === 'Like New' ? 'S급 (사용감 없음)' :
                          deviceInfo.condition === 'Good' ? 'A급 (깨끗함)' : '사용감 있음'}
                      {deviceInfo.condition === 'New' && <CheckCircle2 className="w-3 h-3" />}
                    </span>
                  </div>
                  {deviceInfo.specs && Object.entries(deviceInfo.specs).map(([key, value]) => (
                    <div key={key}>
                      <span className="block text-gray-400 text-xs mb-1 capitalize">{key === 'storage' ? '용량' : key === 'year' ? '출시연도' : key}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">상품 설명</h3>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <img src={product.seller.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-bold text-sm text-gray-900">{product.seller.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    매너온도 {product.seller.rating * 20}°C
                  </p>
                </div>
              </div>
              <button className="text-indigo-600 text-sm font-semibold hover:underline">
                프로필 보기
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button className="flex justify-center items-center gap-2 py-3.5 rounded-xl border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                채팅하기
              </button>
              <button className="flex justify-center items-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:scale-[1.02]">
                <ShoppingBag className="w-5 h-5" />
                안전결제
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};