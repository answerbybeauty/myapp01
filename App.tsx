
import React, { useState, useMemo, useCallback } from 'react';
import { ProductInfo, LowestPriceInfo } from './types';
import { fetchProductInfoAndPrices, generateBannerImage, generateProductTags } from './services/geminiService';

const BarcodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);
const PriceTagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a1 1 0 011-1h5a1 1 0 01.707.293l7 7zM6 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
);

const App: React.FC = () => {
    const [barcode, setBarcode] = useState<string>('8801062628479');
    const [productNameInput, setProductNameInput] = useState<string>('');
    const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
    const [costPrice, setCostPrice] = useState<string>('');
    const [shippingFee, setShippingFee] = useState<string>('');
    const [margin, setMargin] = useState<string>('');
    const [tags, setTags] = useState<string[] | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState({ prices: false, banner: false, tags: false });
    const [error, setError] = useState<string | null>(null);

    const optimalPrice = useMemo(() => {
        const cost = parseFloat(costPrice) || 0;
        const shipping = parseFloat(shippingFee) || 0;
        const profitMargin = parseFloat(margin) || 0;
        return cost + shipping + profitMargin;
    }, [costPrice, shippingFee, margin]);

    const handleSearch = useCallback(async () => {
        if (!barcode) {
            setError('바코드를 입력해주세요.');
            return;
        }
        setError(null);
        setProductInfo(null);
        setBannerUrl('');
        setTags(null);
        setIsLoading(prev => ({ ...prev, prices: true, tags: false, banner: false }));
        try {
            const info = await fetchProductInfoAndPrices(barcode, productNameInput);
            setProductInfo(info);
        } catch (err: any) {
            setError(err.message || '정보를 가져오는데 실패했습니다.');
        } finally {
            setIsLoading(prev => ({ ...prev, prices: false }));
        }
    }, [barcode, productNameInput]);
    
    const handleGenerateTags = useCallback(async () => {
        if (!productInfo?.productName || !productInfo?.productDescription) {
            setError('태그를 생성하려면 상품 정보가 필요합니다.');
            return;
        }
        setError(null);
        setIsLoading(prev => ({ ...prev, tags: true }));
        try {
            const generatedTags = await generateProductTags(productInfo.productName, productInfo.productDescription);
            setTags(generatedTags);
        } catch (err: any) {
            setError(err.message || '태그 생성에 실패했습니다.');
        } finally {
            setIsLoading(prev => ({ ...prev, tags: false }));
        }
    }, [productInfo]);

    const handleGenerateBanner = useCallback(async () => {
        if (!productInfo?.productName || optimalPrice <= 0) {
            setError('배너를 생성하려면 상품 정보와 유효한 판매가가 필요합니다.');
            return;
        }
        setError(null);
        setIsLoading(prev => ({ ...prev, banner: true }));
        try {
            const url = await generateBannerImage(productInfo.productName, optimalPrice);
            setBannerUrl(url);
        } catch (err: any) {
            setError(err.message || '배너 생성에 실패했습니다.');
        } finally {
            setIsLoading(prev => ({ ...prev, banner: false }));
        }
    }, [productInfo, optimalPrice]);

    const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                        최적 판매가 & 배너 생성기
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">상품 바코드로 최저가를 찾고, 최적 판매가를 계산하여 홍보 배너를 만드세요.</p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-gray-700 flex flex-col gap-8">
                        <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-gray-300 mb-2 flex items-center"><BarcodeIcon /> <span className="ml-2">1. 상품 정보 입력</span></label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    id="barcode"
                                    type="text"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="바코드 입력"
                                    className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                                <input
                                    id="productName"
                                    type="text"
                                    value={productNameInput}
                                    onChange={(e) => setProductNameInput(e.target.value)}
                                    placeholder="상품명 입력 (선택)"
                                    className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isLoading.prices}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shrink-0"
                                >
                                    {isLoading.prices ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "검색"}
                                </button>
                            </div>
                        </div>

                        {productInfo && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-300 mb-3">2. 판매 정보 입력</h3>
                                    <div className="space-y-4">
                                        <InputField label="공급가 (원)" value={costPrice} onChange={handleNumericInputChange(setCostPrice)} placeholder="10000" />
                                        <InputField label="배송비 (원)" value={shippingFee} onChange={handleNumericInputChange(setShippingFee)} placeholder="3000" />
                                        <InputField label="희망 마진 (원)" value={margin} onChange={handleNumericInputChange(setMargin)} placeholder="5000" />
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={handleGenerateTags}
                                        disabled={isLoading.tags}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-lg"
                                    >
                                        {isLoading.tags ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "🏷️ 3. 최적 태그 생성"}
                                    </button>
                                </div>
                                <div>
                                    <div className="bg-gray-900 rounded-lg p-4 text-center">
                                        <p className="text-gray-400 text-sm">최적 판매가</p>
                                        <p className="text-3xl font-bold text-teal-300">
                                            {optimalPrice > 0 ? optimalPrice.toLocaleString() : 0}원
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={handleGenerateBanner}
                                        disabled={isLoading.banner || optimalPrice <= 0}
                                        className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-lg"
                                    >
                                        {isLoading.banner ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "✨ 4. 배너 생성"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Results */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-gray-700 min-h-[300px]">
                        <h2 className="text-2xl font-bold mb-4 text-gray-100">결과</h2>
                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
                        
                        {isLoading.prices && <div className="pt-10"><LoadingSpinner /></div>}

                        {productInfo && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-gray-900/70 p-4 rounded-lg">
                                    <h3 className="text-xl font-semibold text-blue-300">{productInfo.productName}</h3>
                                    <p className="text-gray-400 mt-1">{productInfo.productDescription}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-300 mb-2">최저가 검색 결과 (최대 5개)</h4>
                                    <ul className="space-y-2">
                                        {productInfo.prices.map((item, index) => (
                                            <PriceListItem key={index} item={item} />
                                        ))}
                                    </ul>
                                </div>

                                {isLoading.tags && <div className="pt-6"><LoadingSpinner /></div>}
                                
                                {tags && (
                                    <div className="animate-fade-in">
                                        <h4 className="font-semibold text-gray-300 mb-2">추천 태그</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag, index) => (
                                                <span key={index} className="bg-gray-700 text-sm text-cyan-300 px-3 py-1 rounded-full">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isLoading.banner && <div className="pt-10"><LoadingSpinner /></div>}
                                
                                {bannerUrl && (
                                    <div className="animate-fade-in mt-6">
                                        <h4 className="font-semibold text-gray-300 mb-2">생성된 배너</h4>
                                        <img src={bannerUrl} alt="Generated Product Banner" className="rounded-lg shadow-lg w-full" />
                                    </div>
                                )}
                            </div>
                        )}
                         {!isLoading.prices && !productInfo && !error && (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>바코드를 검색하여 시작하세요.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />
    </div>
);

const PriceListItem: React.FC<{item: LowestPriceInfo}> = ({ item }) => (
    <li className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors">
        <div>
            <p className="font-medium text-gray-200">{item.store}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                {item.url}
            </a>
        </div>
        <div className="flex items-center bg-teal-500/10 text-teal-300 font-bold text-sm px-3 py-1 rounded-full whitespace-nowrap">
            <PriceTagIcon />
            {item.price.toLocaleString()}원
        </div>
    </li>
);

export default App;
