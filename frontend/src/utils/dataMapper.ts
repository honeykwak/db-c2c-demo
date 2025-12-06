import { Product, CategoryType } from '../types';

// Helper to determine category type from ID
// Hierarchy:
// 1(Digital) -> 4,5,6
// 2(Appliances)
// 3(Ticket) -> 7,8,9
const getCategoryType = (catId: number | string): CategoryType => {
    const id = Number(catId);
    if ([3, 7, 8, 9].includes(id)) return CategoryType.TICKET;
    if ([2].includes(id)) return CategoryType.APPLIANCES;
    return CategoryType.DIGITAL;
};

// Helper to generate mock image based on title/category
const getImageUrl = (title: string, catType: CategoryType) => {
    // Top Priority: Details based on CatType
    if (catType === CategoryType.TICKET) {
        return 'https://placehold.co/600x800/2a2a2a/FFF?text=TICKET';
    }

    const t = title.toLowerCase();
    if (t.includes('iphone')) return 'https://placehold.co/600x600/f5f5f7/333?text=iPhone';
    if (t.includes('galaxy') || t.includes('s24')) return 'https://placehold.co/600x600/f5f5f7/333?text=Galaxy';
    if (t.includes('macbook') || t.includes('laptop')) return 'https://placehold.co/600x600/f5f5f7/333?text=MacBook';

    return 'https://placehold.co/600x600/f5f5f7/999?text=Product';
};

export const mapItemToProduct = (item: any): Product => {
    const catType = getCategoryType(item.category_id);

    // Parse JSON fields if they are strings (Backend might send them as strings or objects depending on driver)
    let seatInfo = item.seat_info;
    if (typeof seatInfo === 'string') {
        try { seatInfo = JSON.parse(seatInfo); } catch (e) { seatInfo = null; }
    }

    let specs = item.specs;
    if (typeof specs === 'string') {
        try { specs = JSON.parse(specs); } catch (e) { specs = null; }
    }

    // Calculate Premium for Tickets
    let premiumPercent = 0;
    const originalPrice = Number(item.original_price);
    const currentPrice = Number(item.price);
    if (catType === CategoryType.TICKET && originalPrice > 0) {
        premiumPercent = Math.round(((currentPrice - originalPrice) / originalPrice) * 100);
    }

    return {
        id: String(item.item_id),
        title: item.title,
        price: Number(item.price),
        imageUrl: getImageUrl(item.title, catType),
        category: catType,
        categoryId: String(item.category_id),
        description: item.description || '',
        createdAt: new Date().toISOString(),
        seller: {
            name: `User${item.seller_id}`,
            rating: 4.5,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller_id}`
        },
        // DB Feature Demo Mapping
        productCode: item.product_code || undefined,
        originalPrice: originalPrice || undefined,
        premiumPercent: premiumPercent,

        details: {
            // Standard Product Fields
            brand: item.brand_name,
            model: item.model_name,
            specs: specs,

            // Ticket Fields
            artist: item.artist_name || item.title,
            venue: item.venue,
            date: item.event_datetime,
            grade: seatInfo?.grade,
            sector: seatInfo?.sector,
            row: seatInfo?.row,
            number: seatInfo?.number,
        }
    };
};
