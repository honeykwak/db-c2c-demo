import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { Product, CategoryType, TicketDetails, DeviceDetails } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isTicket = product.category === CategoryType.TICKET;
  const ticketInfo = isTicket ? (product.details as TicketDetails) : null;
  const deviceDetails = !isTicket ? (product.details as DeviceDetails) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <Link to={`/product/${product.id}`} className="group block h-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
            <Heart className="w-4 h-4" />
          </button>

          {/* Ticket Badge - Crucial Requirement */}
          {isTicket && ticketInfo && (
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
              <span className={`px-2 py-1 text-xs font-bold rounded-md shadow-sm backdrop-blur-md
                ${ticketInfo.grade === 'VIP' 
                  ? 'bg-amber-400/90 text-amber-950 border border-amber-300/50' 
                  : 'bg-indigo-600/90 text-white border border-indigo-400/50'}`}>
                {ticketInfo.grade}석
              </span>
              <span className="px-2 py-1 text-[10px] font-semibold bg-black/50 backdrop-blur-md text-white rounded-md border border-white/10">
                {ticketInfo.sector}구역
              </span>
            </div>
          )}
          
          {/* Device Condition Badge */}
          {!isTicket && deviceDetails && (
            <div className="absolute bottom-3 left-3">
               <span className="px-2 py-1 text-[10px] font-medium bg-white/90 backdrop-blur-sm text-gray-700 rounded-md shadow-sm">
                {deviceDetails.condition === 'New' ? '미개봉' : 
                 deviceDetails.condition === 'Like New' ? 'S급' :
                 deviceDetails.condition === 'Good' ? 'A급' : '사용감 있음'}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <h3 className="font-medium text-gray-900 leading-snug mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {product.title}
            </h3>
            
            {/* Meta Info (Location/Date) */}
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              {isTicket && ticketInfo ? (
                <>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ticketInfo.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{ticketInfo.venue}</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-400">
                   등록: {formatDate(product.createdAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between mt-2 pt-3 border-t border-gray-50">
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">판매가</span>
               <span className="font-bold text-lg text-gray-900">
                {product.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-0.5">원</span>
              </span>
            </div>
            
            {/* Seller Avatar Mini */}
            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
               <img src={product.seller.avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};