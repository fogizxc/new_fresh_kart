import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mic,
  MicOff,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ApiProduct } from '../services/api';
import { parseGroceryList, type ParsedListItem } from '../services/quickListParser';
import { addItemToCart } from '../services/cart';

interface SmartQuickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ApiProduct[];
  selectedShopId?: string | null;
  onAddedToCart: () => void;
  flash: (msg: string) => void;
}

export const SmartQuickListModal: React.FC<SmartQuickListModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedShopId,
  onAddedToCart,
  flash
}) => {
  const [inputText, setInputText] = useState(
    '1 kg potato\n500 g tomato\n2 packet milk\n1 loaf brown bread\n6 eggs'
  );
  const [parsedItems, setParsedItems] = useState<ParsedListItem[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Parse text whenever input text or products change
  useEffect(() => {
    if (inputText.trim()) {
      const parsed = parseGroceryList(inputText, products);
      setParsedItems(parsed);
    } else {
      setParsedItems([]);
    }
  }, [inputText, products]);

  if (!isOpen) return null;

  const toggleItem = (index: number) => {
    setParsedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleSpeechInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      flash('Speech recognition is not supported in this browser. Please type or paste your list.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        flash('Listening... Speak grocery items (e.g., "one kilo onion, two milk, butter")');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Split spoken list by "and" or commas
        const items = transcript
          .split(/,\s*|\s+and\s+/i)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join('\n');

        setInputText(prev => (prev ? `${prev}\n${items}` : items));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        flash('Could not understand audio. Try speaking closer to microphone.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      flash('Microphone permission or speech service error');
    }
  };

  const selectedMatched = parsedItems.filter(i => i.isSelected && i.matchedProduct);

  const totalEstimate = selectedMatched.reduce(
    (sum, i) => sum + (i.matchedProduct?.sellingPrice || 0) * i.requestedQty,
    0
  );

  const handleAddAllToCart = () => {
    let count = 0;
    for (const item of selectedMatched) {
      if (item.matchedProduct) {
        addItemToCart(
          item.matchedProduct.id,
          item.requestedQty,
          item.matchedProduct.shopId || selectedShopId || undefined,
          false
        );
        count += item.requestedQty;
      }
    }

    onAddedToCart();
    flash(`Added ${count} items to cart from your quick-list!`);
    onClose();
  };

  const loadPreset = (presetText: string) => {
    setInputText(presetText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-black/10 my-6">
        {/* Header */}
        <div className="bg-[#173d2e] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d7ef8d] text-[#173d2e]">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Smart Quick-List & Voice Order</h3>
              <p className="text-xs text-emerald-200">
                Paste your WhatsApp list or dictate by voice — we match store items instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Presets & Speech Button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="text-[11px] uppercase tracking-wider text-gray-400">Quick Samples:</span>
              <button
                type="button"
                onClick={() => loadPreset('2 packet milk\n1 loaf whole wheat bread\n6 farm eggs\n1 butter 100g')}
                className="rounded-xl bg-[#f0f4f0] px-2.5 py-1 text-[11px] font-black text-[#173d2e] hover:bg-[#e2ebe2]"
              >
                Breakfast Basics
              </button>
              <button
                type="button"
                onClick={() => loadPreset('1 kg onion\n1 kg potato\n500 g tomato\n1 ginger garlic paste\ncoriander bunch')}
                className="rounded-xl bg-[#f0f4f0] px-2.5 py-1 text-[11px] font-black text-[#173d2e] hover:bg-[#e2ebe2]"
              >
                Tadka Veggies
              </button>
              <button
                type="button"
                onClick={() => loadPreset('500 g paneer\n1 packet butter\nheavy cream\nkasuri methi')}
                className="rounded-xl bg-[#f0f4f0] px-2.5 py-1 text-[11px] font-black text-[#173d2e] hover:bg-[#e2ebe2]"
              >
                Paneer Makhani Kit
              </button>
            </div>

            <button
              type="button"
              onClick={handleSpeechInput}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isListening ? 'Listening...' : 'Dictate Voice'}</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste your grocery list here (one item per line or separated by commas)..."
              className="w-full rounded-2xl border border-gray-300 bg-gray-50/50 p-3.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-700 focus:bg-white transition"
            />
          </div>

          {/* Matched Products View */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Matched Catalog Products ({selectedMatched.length} of {parsedItems.length} selected)
              </h4>
              <span className="text-xs font-bold text-gray-400">
                Estimated Total: <span className="text-gray-900 font-black">₹{totalEstimate}</span>
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {parsedItems.map((item, idx) => {
                const prod = item.matchedProduct;
                return (
                  <div
                    key={idx}
                    onClick={() => prod && toggleItem(idx)}
                    className={`flex items-center justify-between rounded-xl p-3 border transition cursor-pointer ${
                      !prod
                        ? 'border-dashed border-gray-200 bg-gray-50/50 opacity-60'
                        : item.isSelected
                        ? 'border-emerald-900/20 bg-[#f8faf8]'
                        : 'border-gray-200 bg-white opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={!prod}
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                          item.isSelected && prod
                            ? 'border-[#173d2e] bg-[#173d2e] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {item.isSelected && prod && <Check size={13} className="stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">
                            {prod ? prod.name : item.query}
                          </span>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-600">
                            Requested: {item.requestedQty} {item.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {prod ? (
                            <span className="text-emerald-700 font-bold">
                              ✓ Matched ({prod.category}) • ₹{prod.sellingPrice} / {prod.unit}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold">
                              Not in current catalog stock
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {prod ? (
                        <span className="text-xs font-black text-gray-900">
                          ₹{prod.sellingPrice * item.requestedQty}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-xs">
            <span className="text-gray-500 font-bold">Total: </span>
            <span className="text-lg font-black text-[#173d2e]">₹{totalEstimate}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              disabled={selectedMatched.length === 0}
              onClick={handleAddAllToCart}
              className="inline-flex items-center gap-2 rounded-xl bg-[#173d2e] px-6 py-2.5 text-xs font-black text-white hover:bg-[#20503e] transition shadow-xs disabled:opacity-50"
            >
              <ShoppingBag size={15} />
              <span>Add {selectedMatched.length} Items to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
