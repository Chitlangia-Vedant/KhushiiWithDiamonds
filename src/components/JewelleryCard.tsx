import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Gem, Crown } from 'lucide-react';
import { JewelleryItem } from '../types';
import { calculateJewelleryPriceSync, getPriceBreakdown } from '../lib/goldPrice';
import { useClickOutside } from '../hooks/useClickOutside.ts'

interface JewelleryCardProps {
  item: JewelleryItem;
}

const JewelleryCard: React.FC<JewelleryCardProps> = ({ item }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedDiamondQuality, setSelectedDiamondQuality] = useState<string>('');
  const [selectedGoldQuality, setSelectedGoldQuality] = useState<string>('14K');
  const { ref: diamondRef, isOpen: showDiamond, setIsOpen: setDiamond } = useClickOutside<HTMLDivElement>();
  const { ref: goldRef, isOpen: showGold, setIsOpen: setGold } = useClickOutside<HTMLDivElement>();

  const images = item.images || [];
  const hasDiamonds = item.diamonds && Object.keys(item.diamonds).length > 0;
  const diamondQualities = useMemo(() => hasDiamonds ? Object.keys(item.diamonds) : [], [hasDiamonds, item.diamonds]);

  // Initialize selected diamond quality
  useEffect(() => {
    if (hasDiamonds && diamondQualities.length > 0 && !selectedDiamondQuality) {
      setSelectedDiamondQuality(diamondQualities[0]);
    }
  }, [hasDiamonds, diamondQualities, selectedDiamondQuality]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentPrice = calculateJewelleryPriceSync(item, selectedDiamondQuality, selectedGoldQuality);
  const priceBreakdown = getPriceBreakdown(item, selectedDiamondQuality, selectedGoldQuality);

  const goldQualityOptions = [
    { value: '14K', label: '14K Gold', purity: '58.3%' },
    { value: '18K', label: '18K Gold', purity: '75.0%' },
    { value: '24K', label: '24K Gold', purity: '100%' }
  ];

  const getSelectedGoldLabel = () => {
    const option = goldQualityOptions.find(opt => opt.value === selectedGoldQuality);
    return option ? option.label : selectedGoldQuality;
  };

  const getDiamondSummary = (quality: string) => {
    if (!item.diamonds || !item.diamonds[quality]) return '';
    const diamonds = item.diamonds[quality];
    const totalCarats = diamonds.reduce((sum, d) => sum + d.carat_weight, 0);
    const count = diamonds.length;
    return `${totalCarats.toFixed(2)}ct (${count} ${count === 1 ? 'diamond' : 'diamonds'})`;
  };

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

          {/* Gold Quality Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Gold Quality</label>
            <div className="relative" ref={goldRef}>
              <button
                onClick={() => setGold(!showGold)}
                className="relative z-40 w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
              >
                <div className="flex items-center">
                  <Crown className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">{getSelectedGoldLabel()}</span>
                </div>
                <ChevronLeft className={`w-4 h-4 text-gray-400 transform transition-transform ${showGold ? '-rotate-90' : 'rotate-180'}`} />
              </button>
              
              {showGold && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {goldQualityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedGoldQuality(option.value);
                        setGold(false);
                      }}
                      className={`relative z-50 w-full px-3 py-2 text-left hover:bg-yellow-50 focus:outline-none focus:bg-yellow-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        selectedGoldQuality === option.value ? 'bg-yellow-100 text-yellow-800' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.purity}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Diamond Quality Selection */}
          {hasDiamonds && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Diamond Quality</label>
              <div className="relative" ref={diamondRef}>
                <button
                  onClick={() => setDiamond(!showDiamond)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <div className="flex items-center">
                    <Gem className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">{selectedDiamondQuality}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 text-gray-400 transform transition-transform ${showDiamond ? '-rotate-90' : 'rotate-180'}`} />
                </button>
                
                {showDiamond && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {diamondQualities.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => {
                          setSelectedDiamondQuality(quality);
                          setDiamond(false);
                        }}
                        className={`relative z-50 w-full px-3 py-2 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedDiamondQuality === quality ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{quality}</span>
                          <span className="text-xs text-gray-500">{getDiamondSummary(quality)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
            </div>
            
            {/* Price Breakdown */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Gold ({selectedGoldQuality}):</span>
                <span>₹{priceBreakdown.goldCost.toLocaleString('en-IN')}</span>
              </div>
              {hasDiamonds && priceBreakdown.diamondCost > 0 && (
                <div className="flex justify-between">
                  <span>Diamonds ({selectedDiamondQuality}):</span>
                  <span>₹{priceBreakdown.diamondCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Making Charges:</span>
                <span>₹{priceBreakdown.makingCharges.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown Overlay */}
      {(showDiamond || showGold) && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => {
              setDiamond(false);
              setGold(false);
            }}
          />
      )}

      {/* Image Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
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