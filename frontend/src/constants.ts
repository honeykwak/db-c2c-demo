import { Category, CategoryType, Product, SkuOption } from './types';

// 4.1. Category Hierarchy (Recursive Structure)
// MUST MATCH DATABASE IDs EXACTLY
// 1: Digital, 2: Appliances, 3: Ticket
// 4: Smartphone, 5: Laptop, 6: Audio
// 7: Concert, 8: Sports, 9: Musical
export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: '디지털기기',
    type: CategoryType.DIGITAL,
    parentId: null,
    children: [
      { id: '4', name: '스마트폰', type: CategoryType.DIGITAL, parentId: '1' },
      { id: '5', name: '노트북', type: CategoryType.DIGITAL, parentId: '1' },
      { id: '6', name: '오디오/헤드폰', type: CategoryType.DIGITAL, parentId: '1' },
    ],
  },
  {
    id: '2',
    name: '생활가전',
    type: CategoryType.APPLIANCES,
    parentId: null,
    children: [], // Single depth
  },
  {
    id: '3',
    name: '티켓/교환권',
    type: CategoryType.TICKET,
    parentId: null,
    children: [
      { id: '7', name: '콘서트', type: CategoryType.TICKET, parentId: '3' },
      { id: '8', name: '스포츠', type: CategoryType.TICKET, parentId: '3' },
      { id: '9', name: '뮤지컬/연극', type: CategoryType.TICKET, parentId: '3' },
    ],
  },
];

// 4.2. Real Data Glossary (Mock Products)
export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: '아이유(IU) H.E.R. World Tour Concert 서울 첫콘 VIP석 양도합니다',
    price: 165000,
    imageUrl: 'https://picsum.photos/seed/iu/400/400',
    category: CategoryType.TICKET,
    categoryId: '3-1',
    description: '사정이 생겨서 못 가게 되었습니다. 현장수령 도와드려요.',
    createdAt: '2024-05-10T09:00:00Z',
    seller: { name: 'jieun_love', rating: 4.9, avatarUrl: 'https://picsum.photos/seed/seller1/50/50' },
    details: {
      artist: '아이유(IU)',
      venue: '서울 잠실주경기장',
      date: '2024-09-21T19:00:00Z',
      grade: 'VIP',
      sector: 'Floor',
      row: 1,
      number: 15,
    },
  },
  {
    id: 'prod-2',
    title: 'iPhone 15 Pro 256GB 내추럴 티타늄 미개봉 팝니다',
    price: 1350000,
    imageUrl: 'https://picsum.photos/seed/iphone15/400/500',
    category: CategoryType.DIGITAL,
    categoryId: '1-1',
    description: '선물 받았는데 이미 사용 중인 폰이 있어서 판매합니다. 완전 미개봉입니다.',
    createdAt: '2024-05-11T10:30:00Z',
    seller: { name: 'apple_mania', rating: 4.5, avatarUrl: 'https://picsum.photos/seed/seller2/50/50' },
    details: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      condition: 'New', // 미개봉
      specs: { storage: '256GB', processor: 'A17 Pro' },
    },
  },
  {
    id: 'prod-3',
    title: 'T1 vs Gen.G LCK 결승전 R석 2연석',
    price: 80000,
    imageUrl: 'https://picsum.photos/seed/lck/600/400',
    category: CategoryType.TICKET,
    categoryId: '3-2',
    description: '친구랑 가려고 했는데 친구가 못 간대요. 정가 양도합니다.',
    createdAt: '2024-05-12T14:15:00Z',
    seller: { name: 'faker_god', rating: 5.0, avatarUrl: 'https://picsum.photos/seed/seller3/50/50' },
    details: {
      artist: 'T1 vs Gen.G',
      venue: 'KSPO Dome',
      date: '2024-08-30T17:00:00Z',
      grade: 'R',
      sector: 'C',
      row: 12,
      number: 4,
    },
  },
  {
    id: 'prod-4',
    title: 'Galaxy S24 Ultra 티타늄 그레이 자급제 S급 풀박스',
    price: 1100000,
    imageUrl: 'https://picsum.photos/seed/s24/400/400',
    category: CategoryType.DIGITAL,
    categoryId: '1-1',
    description: '구매한지 2주 되었습니다. 케이스 껴서 기스 하나도 없습니다.',
    createdAt: '2024-05-09T11:20:00Z',
    seller: { name: 'galaxy_fan', rating: 4.2, avatarUrl: 'https://picsum.photos/seed/seller4/50/50' },
    details: {
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      condition: 'Like New',
      specs: { storage: '512GB', year: '2024' },
    },
  },
  {
    id: 'prod-5',
    title: '임영웅 콘서트 IM HERO 서울콘 A석',
    price: 121000,
    imageUrl: 'https://picsum.photos/seed/hero/400/600',
    category: CategoryType.TICKET,
    categoryId: '3-1',
    description: '부모님 보내드리려다가 날짜 착각해서 팝니다 ㅠㅠ',
    createdAt: '2024-05-12T16:00:00Z',
    seller: { name: 'trot_lover', rating: 4.8, avatarUrl: 'https://picsum.photos/seed/seller5/50/50' },
    details: {
      artist: '임영웅',
      venue: '상암 월드컵경기장',
      date: '2024-05-25T18:00:00Z',
      grade: 'A',
      sector: 'E-North',
      row: 45,
      number: 10,
    },
  },
  {
    id: 'prod-6',
    title: 'MacBook Air M2 미드나이트 13인치 급처',
    price: 950000,
    imageUrl: 'https://picsum.photos/seed/macbook/500/400',
    category: CategoryType.DIGITAL,
    categoryId: '1-2',
    description: '생활 기스 조금 있습니다. 충전기 포함.',
    createdAt: '2024-05-08T08:00:00Z',
    seller: { name: 'dev_kim', rating: 4.0, avatarUrl: 'https://picsum.photos/seed/seller6/50/50' },
    details: {
      brand: 'Apple',
      model: 'MacBook Air M2',
      condition: 'Good',
      specs: { storage: '256GB', ram: '8GB' },
    },
  },
];

// Mock SKU Data for Auto-complete
export const SKU_OPTIONS: SkuOption[] = [
  { id: 'sku-1', brand: 'Apple', model: 'iPhone 15 Pro', imageUrl: 'https://picsum.photos/seed/iphone15/100/100', specs: { storage: '128GB/256GB/512GB' } },
  { id: 'sku-2', brand: 'Samsung', model: 'Galaxy S24 Ultra', imageUrl: 'https://picsum.photos/seed/s24/100/100', specs: { storage: '256GB/512GB' } },
  { id: 'sku-3', brand: 'Apple', model: 'MacBook Pro M3', imageUrl: 'https://picsum.photos/seed/mbp/100/100', specs: { ram: '16GB/32GB' } },
  { id: 'sku-4', brand: 'LG', model: 'Gram 17', imageUrl: 'https://picsum.photos/seed/gram/100/100', specs: { year: '2024' } },
];