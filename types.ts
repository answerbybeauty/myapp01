
export interface LowestPriceInfo {
  store: string;
  price: number;
  url: string;
}

export interface ProductInfo {
  productName: string;
  productDescription: string;
  prices: LowestPriceInfo[];
}
