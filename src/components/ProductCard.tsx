import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product, useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0); // For switching images

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: 'Added to cart!',
      description: `${product.name} has been added to your cart.`,
      duration: 2000,
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
  };

  return (
    <motion.div
      className="card-product group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
    >
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden rounded-lg mb-4">
          {/* Main Image */}
          <img
            src={product.images[activeImage]}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              variant="secondary"
              size="icon"
              className="mr-2 bg-white/90 hover:bg-white"
            >
              <Eye className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Stock indicator */}
          {product.stock < 5 && (
            <div className="absolute top-3 left-3">
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-medium">
                Only {product.stock} left
              </span>
            </div>
          )}

          {/* Sale badge */}
          {product.offerPrice && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                SALE
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail selector */}
        {product.images.length > 1 && (
          <div className="flex justify-center space-x-2 mb-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveImage(idx);
                }}
                className={`w-12 h-12 rounded overflow-hidden border transition-colors ${
                  idx === activeImage ? 'border-primary' : 'border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {/* Category */}
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            {product.category}
          </div>

          {/* Product name */}
          <h3 className="font-playfair font-semibold text-lg leading-tight group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm line-clamp-2">
            {product.description}
          </p>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.offerPrice ? (
                <>
                  <div className="text-2xl font-bold text-primary">
                    ₹{product.offerPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground line-through">
                    ₹{product.price.toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </div>
              )}
            </div>

            <Button onClick={handleAddToCart} className="btn-luxury" size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
