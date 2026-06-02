
import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, DNAParams, LifestyleType, LifestyleOption, ImageResolution, SavedModel } from './types';
import { DNACheckbox } from './components/DNACheckbox';
import { ImageSlot } from './components/ImageSlot';
import { generateFashionImage, generateModelCollection } from './services/gemini';

const LIFESTYLE_OPTIONS: LifestyleOption[] = [
  { id: 'TEE_OFF_MORNING', label: 'Morning Tee-Off', description: 'Nắng sớm trong trẻo trên thảm cỏ', icon: '⛳' },
  { id: 'FAIRWAY_SUNSET', label: 'Golden Fairway', description: 'Hoàng hôn rực rỡ trên sân Golf', icon: '🌅' },
  { id: 'CLUBHOUSE_LOUNGE', label: 'Elite Clubhouse', description: 'Kiến trúc cổ điển sang trọng', icon: '🏛️' },
  { id: 'PUTTING_GREEN', label: 'Putting Master', description: 'Góc nhìn cận cảnh thảm cỏ Green', icon: '🎯' },
  { id: 'GOLF_RESORT_VILLA', label: 'Golf Resort', description: 'Không gian nghỉ dưỡng 5 sao', icon: '🏡' },
  { id: 'DRIVING_RANGE_PRO', label: 'Pro Range', description: 'Sân tập hiện đại, ánh sáng mướt', icon: '🏌️' },
  { id: 'GOLF_PRO_SHOP', label: 'Flagship Store', description: 'Showroom thời trang cao cấp', icon: '🛍️' },
  { id: 'BUNKER_SHOT', label: 'Dramatic Bunker', description: 'Cát trắng và ánh nắng tương phản', icon: '🏜️' },
  { id: 'GOLF_CART_PATH', label: 'Cart Path Walk', description: 'Lối đi dạo ven hồ thơ mộng', icon: '🛶' },
  { id: '3D_GOLF_SIMULATOR', label: 'Indoor Hi-Tech', description: 'Phòng tập 3D chuyên nghiệp', icon: '🖥️' },
  { id: 'LUXURY_LOCKER_ROOM', label: 'Locker Suite', description: 'Nội thất gỗ sồi đẳng cấp', icon: '🔑' },
  { id: 'CHAMPIONSHIP_PODIUM', label: 'Winner Podium', description: 'Bối cảnh trao giải vinh quang', icon: '🏆' },
  { id: 'STUDIO_MINIMAL', label: 'Minimal Studio', description: 'Phông nền trắng tối giản, hiện đại', icon: '📸' },
  { id: 'STUDIO_EDITORIAL', label: 'Editorial Studio', description: 'Ánh sáng thời trang, đổ bóng mềm', icon: '🎞️' },
  { id: 'STUDIO_DRAMATIC', label: 'Dramatic Studio', description: 'Ánh sáng tương phản cao, nghệ thuật', icon: '🔦' },
  { id: 'NEON_NIGHT_GOLF', label: 'Neon Night', description: 'Ánh sáng cực quang, tương lai', icon: '🌌' },
  { id: 'DESERT_OASIS', label: 'Desert Oasis', description: 'Cát vàng và ốc đảo xanh mướt', icon: '🏜️' },
  { id: 'RAINY_PERFORMANCE', label: 'Rainy Performance', description: 'Mưa phùn và hiệu ứng ướt át', icon: '🌧️' },
  { id: 'ABSTRACT_FASHION', label: 'Abstract Art', description: 'Bối cảnh nghệ thuật trừu tượng', icon: '🎨' },
  { id: 'VINTAGE_HERITAGE', label: 'Vintage Heritage', description: 'Phong cách cổ điển thập niên 50', icon: '🎞️' },
];

const POSE_OPTIONS = [
  { id: 'PORTRAIT', label: 'Portrait', icon: '👤' },
  { id: 'SWING', label: 'Full Swing', icon: '🏌️' },
  { id: 'PUTTING', label: 'Putting', icon: '🎯' },
  { id: 'WALKING', label: 'Walking', icon: '🚶' },
  { id: 'SITTING', label: 'Relaxing', icon: '🪑' },
];

const RESOLUTION_OPTIONS: { id: ImageResolution; label: string; desc: string }[] = [
  { id: '1K', label: 'Preview', desc: '1024px' },
  { id: '2K', label: 'Retina HD', desc: '2048px' },
  { id: '4K', label: 'Print Ready', desc: '4096px' },
];

const DB_NAME = 'GolfStudioDB';
const STORE_NAME = 'ModelsStore';
const HISTORY_STORE = 'HistoryStore';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const processImageToJpeg = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 2048;
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ANGLES);
  const [dnaImage, setDnaImage] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<LifestyleType>('TEE_OFF_MORNING');
  const [selectedPose, setSelectedPose] = useState<any>('PORTRAIT');
  const [selectedResolution, setSelectedResolution] = useState<ImageResolution>('1K');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [dnaLocks, setDnaLocks] = useState<DNAParams>({
    face: true,
    body: true,
    product: true,
    pose: 'PORTRAIT'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await initDB();
        
        // Load Models
        const modelTx = db.transaction(STORE_NAME, 'readonly');
        const modelStore = modelTx.objectStore(STORE_NAME);
        const modelReq = modelStore.getAll();
        modelReq.onsuccess = () => {
          const sorted = (modelReq.result as SavedModel[]).sort((a, b) => b.timestamp - a.timestamp);
          setSavedModels(sorted);
        };

        // Load History
        const historyTx = db.transaction(HISTORY_STORE, 'readonly');
        const historyStore = historyTx.objectStore(HISTORY_STORE);
        const historyReq = historyStore.getAll();
        historyReq.onsuccess = () => {
          const sorted = (historyReq.result as any[]).sort((a, b) => b.timestamp - a.timestamp);
          setHistory(sorted);
        };
      } catch (e) { console.error(e); }
    };
    loadData();
    const checkKey = async () => {
      try {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } catch (e) { console.error(e); }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = useCallback((files: FileList, type: 'dna' | 'product') => {
    const maxFiles = type === 'dna' ? 1 : 10;
    const fileArray = Array.from(files).slice(0, maxFiles);
    const readers = fileArray.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const processed = await processImageToJpeg(reader.result as string);
          resolve(processed);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(base64s => {
      if (type === 'dna') setDnaImage(base64s);
      else setProductImages(base64s);
    });
  }, []);

  const handleSaveModel = async () => {
    if (dnaImage.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const newModel: SavedModel = { id: Date.now().toString(), dataUrl: dnaImage[0], timestamp: Date.now() };
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(newModel);
      tx.oncomplete = () => {
        setSavedModels([newModel, ...savedModels].slice(0, 40));
        setIsSaving(false);
      };
    } catch (e) { alert("Lỗi lưu thư viện."); setIsSaving(false); }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Golf-Collection-${selectedResolution}`);
      results.forEach((url, idx) => {
        const base64Data = url.split(',')[1];
        folder?.file(`golf-look-${idx + 1}.jpg`, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Golf-Collection-${Date.now()}.zip`;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi nén ảnh. Vui lòng thử lại.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleGenerate = async () => {
    if (dnaImage.length === 0 || ((activeTab !== AppTab.CREATE) && productImages.length === 0)) return alert("Vui lòng tải đủ ảnh!");
    setIsGenerating(true);
    setResults([]);
    
    const isStudio = selectedLifestyle.startsWith('STUDIO');
    const steps = isStudio 
      ? ["Đang thiết lập Studio...", "Cân chỉnh ánh sáng đèn Flash...", "Render chất liệu vải kỹ thuật...", "Hoàn thiện phong thái Golfer..."]
      : ["Đang phân tích thảm cỏ...", "Tính toán ánh sáng sân Golf...", "Render chất liệu vải kỹ thuật...", "Hoàn thiện phong thái Golfer..."];
      
    let stepIdx = 0;
    const interval = setInterval(() => { setLoadingStep(steps[stepIdx % steps.length]); stepIdx++; }, 2500);

    try {
      let finalResults: string[] = [];
      if (activeTab === AppTab.ANGLES) {
        const scenarios = [
          { angle: "Full shot mid-swing", expression: "Focused performance", background: "Pristine Emerald Fairway with distance mountains" },
          { angle: "Medium shot holding driver", expression: "Confident elite smile", background: "Luxury Clubhouse Entrance with expensive cars" },
          { angle: "Seated in golf cart", expression: "Social luxury vibe", background: "Premium resort course during golden hour" },
          { angle: "Full-body mirror selfie, holding smartphone, clean reflection", expression: "Stylish elite golfer selfie perspective, confident gaze", background: "Luxury golf resort fitting room with modern mirror, high-end warm ambient lighting" }
        ];
        finalResults = await generateModelCollection(dnaImage[0], productImages, scenarios, dnaLocks, selectedResolution);
      } else {
        const lifestyleOpt = LIFESTYLE_OPTIONS.find(l => l.id === selectedLifestyle);
        const lifestyle = lifestyleOpt?.label;
        const isStudio = selectedLifestyle.startsWith('STUDIO');
        
        let prompt = `Authentic elite Golf photography in ${lifestyle}. Model has a perfectly balanced athletic physique (101-67-99). Model is in a ${selectedPose} pose. Model wearing high-end performance golf apparel. Focus on the sophisticated sports-luxe aesthetic.`;
        
        if (isStudio) {
          prompt += ` This is a professional studio shoot. Use clean studio lighting, professional backdrops, and high-end fashion photography techniques. Override any outdoor fairway lighting requirements.`;
        } else if (selectedLifestyle === 'NEON_NIGHT_GOLF') {
          prompt += ` Cyberpunk aesthetic, neon glowing golf balls, futuristic golf course at night, high contrast lighting.`;
        } else if (selectedLifestyle === 'VINTAGE_HERITAGE') {
          prompt += ` 1950s aesthetic, grainy film texture, classic golf attire, sepia-toned highlights.`;
        }

        const imgs = activeTab === AppTab.TRY_ON ? [dnaImage[0], ...productImages] : [dnaImage[0]];
        const res = await generateFashionImage(prompt, imgs, { ...dnaLocks, pose: selectedPose }, selectedResolution);
        if (res) finalResults = [res];
      }

      if (finalResults.length > 0) {
        setResults(finalResults);
        // Save to History
        const db = await initDB();
        const tx = db.transaction(HISTORY_STORE, 'readwrite');
        const store = tx.objectStore(HISTORY_STORE);
        const lifestyleLabel = LIFESTYLE_OPTIONS.find(l => l.id === selectedLifestyle)?.label || 'Lookbook';
        
        for (const url of finalResults) {
          const historyItem = {
            id: Date.now().toString() + Math.random(),
            url,
            timestamp: Date.now(),
            lifestyle: lifestyleLabel,
            prompt: selectedPose
          };
          store.add(historyItem);
        }
        tx.oncomplete = () => {
          // Reload history
          const hTx = db.transaction(HISTORY_STORE, 'readonly');
          const hStore = hTx.objectStore(HISTORY_STORE);
          const hReq = hStore.getAll();
          hReq.onsuccess = () => {
            const sorted = (hReq.result as any[]).sort((a, b) => b.timestamp - a.timestamp);
            setHistory(sorted);
          };
        };
      }
    } catch (e) { alert("Lỗi Render. Vui lòng kiểm tra lại ảnh hoặc Key."); }
    finally { clearInterval(interval); setIsGenerating(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f4f2] text-[#1a1a1a] font-sans selection:bg-emerald-200">
      {/* SIDEBAR */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[440px] bg-white border-r border-emerald-100 flex flex-col p-10 overflow-y-auto shadow-2xl relative z-10"
      >
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-black tracking-tighter italic">
              GOLF<span className="text-emerald-600">DNA</span>
            </h1>
            <span className="text-[10px] font-bold bg-emerald-950 text-white px-2.5 py-1 rounded-md not-italic tracking-widest">ULTRA PRO</span>
          </div>
          <p className="text-[10px] text-emerald-800/40 font-black uppercase tracking-[0.3em]">Neural Fashion Engine v2.0</p>
        </div>

        <nav className="flex space-x-8 mb-12 border-b border-gray-100 relative">
          {Object.keys(AppTab).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setActiveTab(AppTab[tabKey as keyof typeof AppTab]); setResults([]); }}
              className={`pb-4 text-[11px] font-black transition-all relative uppercase tracking-[0.2em] ${
                activeTab === AppTab[tabKey as keyof typeof AppTab] ? 'text-emerald-700' : 'text-gray-300 hover:text-emerald-400'
              }`}
            >
              {AppTab[tabKey as keyof typeof AppTab] === AppTab.ANGLES && "Lookbook"}
              {AppTab[tabKey as keyof typeof AppTab] === AppTab.TRY_ON && "Try-On"}
              {AppTab[tabKey as keyof typeof AppTab] === AppTab.CREATE && "Creative"}
              {AppTab[tabKey as keyof typeof AppTab] === AppTab.HISTORY && "History"}
              {activeTab === AppTab[tabKey as keyof typeof AppTab] && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700" />
              )}
            </button>
          ))}
        </nav>

        <div className="space-y-10">
          <section className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">DNA Golfer</h3>
              {dnaImage.length > 0 && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveModel} 
                  className="text-[10px] font-black text-emerald-600 uppercase tracking-widest"
                >
                  + Save to Vault
                </motion.button>
              )}
            </div>
            <ImageSlot label="Golfer Model" description="Upload model or client DNA" images={dnaImage} onUpload={(f) => handleFileUpload(f, 'dna')} />
            
            <AnimatePresence>
              {savedModels.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="grid grid-cols-4 gap-3"
                >
                  {savedModels.map((m) => (
                    <motion.div 
                      key={m.id} 
                      whileHover={{ scale: 1.05, y: -2 }}
                      onClick={() => setDnaImage([m.dataUrl])} 
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${dnaImage[0] === m.dataUrl ? 'border-emerald-600 ring-4 ring-emerald-50 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={m.dataUrl} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {activeTab !== AppTab.CREATE && (
            <section className="space-y-5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Technical Apparel</h3>
              <ImageSlot label="Golf Gear" description="Upload 10 angles for 100% fabric accuracy" images={productImages} maxImages={10} onUpload={(f) => handleFileUpload(f, 'product')} />
            </section>
          )}

          {activeTab !== AppTab.ANGLES && activeTab !== AppTab.HISTORY && (
            <section className="space-y-5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Golfer Pose</h3>
              <div className="flex flex-wrap gap-2">
                {POSE_OPTIONS.map((pose) => (
                  <motion.button
                    key={pose.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPose(pose.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedPose === pose.id ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <span className="mr-2">{pose.icon}</span>
                    {pose.label}
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {activeTab !== AppTab.ANGLES && activeTab !== AppTab.HISTORY && (
            <section className="space-y-5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Neural Scene</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <motion.button 
                    key={opt.id} 
                    whileHover={{ scale: 1.02, backgroundColor: '#f0fdf4' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedLifestyle(opt.id)} 
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedLifestyle === opt.id ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-gray-100 bg-white'}`}
                  >
                    <span className="text-2xl block mb-2">{opt.icon}</span>
                    <span className="text-[10px] font-black block uppercase tracking-wider overflow-hidden text-ellipsis">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-5">
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Consistency Locks</h3>
             <div className="bg-emerald-50/40 p-6 rounded-[2rem] space-y-4 border border-emerald-100/50">
               <DNACheckbox label="Neural Identity" checked={dnaLocks.face} onChange={(v) => setDnaLocks({...dnaLocks, face: v})} color="bg-emerald-600" />
               <DNACheckbox label="Athletic Physique" checked={dnaLocks.body} onChange={(v) => setDnaLocks({...dnaLocks, body: v})} color="bg-emerald-600" />
               <DNACheckbox label="Technical Textile" checked={dnaLocks.product} onChange={(v) => setDnaLocks({...dnaLocks, product: v})} color="bg-emerald-600" />
             </div>
             <div className="px-2">
               <p className="text-[9px] text-emerald-800/40 font-black uppercase tracking-[0.2em] leading-relaxed">
                 Elite Calibration:<br/>
                 Bust 101 | Waist 67 | Hips 99
               </p>
             </div>
          </section>

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate} 
            disabled={isGenerating || dnaImage.length === 0} 
            className={`w-full py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] text-white transition-all shadow-2xl ${isGenerating || dnaImage.length === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-emerald-900 hover:bg-emerald-950 hover:shadow-emerald-200'}`}
          >
            {isGenerating ? "Processing Neural Data..." : "Execute Production"}
          </motion.button>
        </div>
      </motion.aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto bg-[#f0f4f2] p-16 relative">
        <div className="max-w-[1300px] mx-auto h-full flex flex-col">
          <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-between items-end mb-16"
          >
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-emerald-950 italic">
                The <span className="text-emerald-600">Pro</span> Collection.
              </h2>
              <p className="text-emerald-800/40 text-[11px] font-bold uppercase tracking-[0.4em] mt-3">High-Dynamic Range Rendering | Phase One IQ4 Optics</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-emerald-50">
                {RESOLUTION_OPTIONS.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResolution(res.id)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedResolution === res.id ? 'bg-emerald-900 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-600'}`}
                  >
                    {res.id}
                  </button>
                ))}
              </div>
              {results.length > 1 && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadAll} 
                  disabled={isDownloadingAll}
                  className="bg-emerald-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center space-x-3"
                >
                  {isDownloadingAll ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Packing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Export Collection</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            {activeTab === AppTab.HISTORY ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-24"
              >
                {history.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative rounded-3xl overflow-hidden shadow-lg bg-white aspect-[3/4]"
                  >
                    <img src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                      <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest mb-1">{item.lifestyle}</p>
                      <p className="text-white text-[10px] font-bold mb-4 uppercase tracking-widest">{item.prompt}</p>
                      <div className="flex space-x-2">
                        <a href={item.url} download={`history-${idx}.jpg`} className="flex-1 bg-white text-black py-2 rounded-xl text-[8px] font-black text-center uppercase tracking-widest">Save</a>
                        <button onClick={() => setResults([item.url])} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-[8px] font-black uppercase tracking-widest">View</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {history.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300">
                    <span className="text-4xl mb-4">📂</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">No history found</p>
                  </div>
                )}
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`grid ${results.length > 1 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl mx-auto'} gap-10 pb-24`}
              >
                {results.map((url, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] bg-white aspect-[3/4]"
                  >
                    <img src={url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">NEURAL RENDER {selectedResolution}</p>
                        <h4 className="text-white text-xl font-black mb-6 tracking-tight italic">Elite Look #{idx + 1}</h4>
                        <a 
                          href={url} 
                          download={`golfdna-pro-${idx + 1}.jpg`} 
                          className="inline-block w-full bg-white text-emerald-950 py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl"
                        >
                          Download Raw Data
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-emerald-200/50 rounded-[4rem] bg-white/50 backdrop-blur-xl shadow-inner"
              >
                {isGenerating ? (
                  <div className="text-center space-y-10">
                    <div className="relative">
                      <div className="w-24 h-24 border-[6px] border-emerald-100 rounded-full mx-auto"></div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-24 h-24 border-[6px] border-emerald-600 border-t-transparent rounded-full mx-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-2xl font-black text-emerald-950 italic tracking-tighter">{loadingStep}</p>
                      <p className="text-emerald-800/30 text-[10px] font-black uppercase tracking-[0.4em]">Optimizing Neural Weights...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center max-w-md p-12">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-100"
                    >
                      <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-2xl font-black uppercase tracking-widest text-emerald-950 mb-4 italic">Engine Standby</h3>
                    <p className="text-emerald-800/50 text-sm font-medium leading-relaxed mb-10">Cung cấp dữ liệu DNA và trang phục kỹ thuật để bắt đầu quy trình render hình ảnh chất lượng cao.</p>
                    {!hasApiKey && (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleConnectKey} 
                        className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                      >
                        Authorize API Access
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default App;

