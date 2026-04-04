import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Gem } from 'lucide-react';
import { JewelleryItem } from '../types';
import { calculateJewelleryPriceSync, getPriceBreakdown, formatCurrency } from '../lib/goldPrice';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { getAvailableDiamondQualities, getDiamondsForQuality } from '../utils/diamondUtils';
import { useQualityContext } from '../context/QualityContext';

interface JewelleryCardProps {
  item: JewelleryItem;
}

const JewelleryCard: React.FC<JewelleryCardProps> = ({ item }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // Fetch live prices and settings automatically
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, gstRate, overrideLiveGoldPrice } = useAdminSettings();
  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  const images = item.image_url || [];

  const availableDiamondQualities = useMemo(() => getAvailableDiamondQualities(item), [item]);

  const hasDiamonds = availableDiamondQualities.length > 0;
  
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Helper to extract the correct diamond array for calculation
  const diamondsData = getDiamondsForQuality(item, globalDiamondQuality);

  // Use the updated pricing functions
  const currentPrice = calculateJewelleryPriceSync(
    item.base_price, item.gold_weight, globalGoldPurity, diamondsData, item.making_charges_per_gram, effectiveGoldPrice, gstRate
  );
  
  const priceBreakdown = getPriceBreakdown(
    item.base_price, item.gold_weight, globalGoldPurity, diamondsData, item.making_charges_per_gram, effectiveGoldPrice, gstRate
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Image Section */}
        <div className="relative aspect-square bg-gray-100">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${item.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowModal(true)}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity z-10"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Gem size={48} />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
          
          {item.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
          )}

          <div className="mt-3 flex items-center justify-between">
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-100">
              {globalGoldPurity} Gold
              {/* Show a red star if it fell back because the global setting wasn't available */}
              {globalGoldPurity !== globalGoldPurity && <span className="text-red-500 ml-0.5" title="Requested purity not available">*</span>}
            </span>
            
            {globalDiamondQuality && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                {globalDiamondQuality}
                {globalDiamondQuality !== globalDiamondQuality && <span className="text-red-500 ml-0.5" title="Requested quality not available">*</span>}
              </span>
            )}
          </div>
          
          <div className="text-lg font-bold text-gray-900">
            ₹{currentPrice.toLocaleString('en-IN')}
          </div>
        </div>

          {/* Price Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentPrice)}
              </span>
            </div>
            
            {/* Price Breakdown */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Gold ({globalGoldPurity}):</span>
                <span>{formatCurrency(priceBreakdown.goldValue)}</span>
              </div>
              {hasDiamonds && priceBreakdown.diamondCost > 0 && (
                <div className="flex justify-between">
                  <span>Diamonds ({globalDiamondQuality}):</span>
                  <span>{formatCurrency(priceBreakdown.diamondCost)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Making Charges:</span>
                <span>{formatCurrency(priceBreakdown.makingCharges)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>
            <img
              src={images[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default JewelleryCard;