// src/contexts/ProductContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './CartContext';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  searchProducts: (query: string) => Product[];
  categories: string[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// ✅ Initial products with 3 images each
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Silver Antique Set',
    price: 2899,
    offerPrice: 2299,
    images: [
      '/assets/silver-antique-set1.jpg',
      '/assets/silver-antique-set2.jpg',
      '/assets/silver-antique-set3.jpg',
    ],
    category: 'necklaces',
    description: 'Exquisite silver eternity featuring brilliant-cut jewels',
    stock: 5,
  },
  {
    id: '2',
    name: 'Stone Necklace',
    price: 799,
    images: [
      '/assets/stone-neck-blue.jpg',
      '/assets/stone-neck-black.jpg',
      '/assets/stone-neck-blue.jpg',
    ],
    category: 'necklaces',
    description: 'Classic blue necklace with cute Stones',
    stock: 15,
  },
  {
    id: '3',
    name: 'Korean Stud',
    price: 3299,
    offerPrice: 2799,
    images: [
      '/assets/korean-stud1.jpg',
      '/assets/korean-stud2.jpg',
      '/assets/korean-stud3.jpg',
    ],
    category: 'earrings',
    description: 'Art deco inspired ruby ring with diamond accents',
    stock: 3,
  },
  // Add more products here as needed
];

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  // API base can be supplied by env or public config.json for GH Pages
  const [apiBase, setApiBase] = useState<string>((import.meta as any).env?.VITE_API_BASE || '/api/products');

  // Load dynamic config for GH Pages, then load products
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Try to load public config.json
      try {
        const cfgRes = await fetch('/config.json', { cache: 'no-store' });
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg && typeof cfg.apiBase === 'string' && cfg.apiBase) {
            setApiBase(cfg.apiBase);
          }
        }
      } catch (_) {}

      try {
        const res = await fetch(((import.meta as any).env?.VITE_API_BASE || '/api/products'), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data) && data.length) {
            setProducts(data);
            setLoadedFromServer(true);
            return;
          }
        }
      } catch (_) {
        // ignore and fallback
      }

      const stored = localStorage.getItem('nyrazari-products');
      if (!cancelled && stored) {
        try {
          setProducts(JSON.parse(stored));
        } catch (_) {
          setProducts(initialProducts);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage so the site still works offline
  useEffect(() => {
    localStorage.setItem('nyrazari-products', JSON.stringify(products));
  }, [products]);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    // Optimistic update; server will return canonical product with id
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        const created: Product = await res.json();
        setProducts(prev => [...prev, created]);
        return;
      }
    } catch (_) {}
    // Fallback local if server unavailable
    const local: Product = { ...productData, id: Date.now().toString() };
    setProducts(prev => [...prev, local]);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    try {
      await fetch(apiBase, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
    } catch (_) {}
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(apiBase, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (_) {}
  };

  const getProductById = (id: string) => products.find(product => product.id === id);

  const getProductsByCategory = (category: string) =>
    products.filter(product => product.category === category);

  const searchProducts = (query: string) => {
    const lower = query.toLowerCase();
    return products.filter(
      product =>
        product.name.toLowerCase().includes(lower) ||
        product.description.toLowerCase().includes(lower) ||
        product.category.toLowerCase().includes(lower)
    );
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getProductsByCategory,
        searchProducts,
        categories,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};
