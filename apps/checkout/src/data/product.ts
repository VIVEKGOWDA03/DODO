import productImage from "../assets/aura-soundmaster-pro-x.png";

export interface Product {
  name: string;
  variant: string;
  quantity: number;
  price: number;
  merchantName: string;
  image: string;
}

const CATALOG: Record<string, Product> = {
  prod_123: {
    name: "Aura SoundMaster Pro X",
    variant: "Matte Space Gray",
    quantity: 1,
    price: 24999,
    merchantName: "Aura Acoustics",
    image: productImage,
  },
};

const FALLBACK_PRODUCT: Product = {
  name: "Checkout Item",
  variant: "Standard",
  quantity: 1,
  price: 0,
  merchantName: "Merchant",
  image: productImage,
};

export function getProduct(productId: string | null): Product {
  if (!productId) return FALLBACK_PRODUCT;
  return CATALOG[productId] ?? FALLBACK_PRODUCT;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
