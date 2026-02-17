import { useState, useEffect } from 'react';
import { PencilIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PageHeader({ title, subtitle, emoji, imageQuery }) {
  const [customImage, setCustomImage] = useState(null);
  const [showEditButton, setShowEditButton] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Carregar imagem personalizada do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`pageHeader_${imageQuery}`);
    if (saved) {
      setCustomImage(saved);
      setImageLoaded(false);
    }
  }, [imageQuery]);

  // Mapeamento de queries para imagens específicas e GRADIENTES
  const headerConfig = {
    'workspace,desk,morning,coffee,healthcare,modern': {
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600'
    },
    'settings,configuration,technology,gear': {
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-gray-600 via-gray-700 to-slate-800'
    },
    'medicine,medical,study,hospital': {
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-red-500 via-pink-500 to-rose-600'
    },
    'study,library,books,education': {
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-orange-500 via-amber-500 to-yellow-600'
    },
    'fitness,gym,health,workout': {
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-green-500 via-emerald-500 to-teal-600'
    },
    'calendar,planning,schedule,organization': {
      image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-blue-500 via-cyan-500 to-indigo-600'
    },
    'brain,mind,thinking,education': {
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-purple-500 via-violet-500 to-fuchsia-600'
    },
    'money,finance,budget,savings': {
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-yellow-500 via-lime-500 to-green-600'
    },
    'heart,health,wellness,care': {
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-pink-500 via-rose-500 to-red-600'
    },
    'chart,data,analytics,statistics': {
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&fit=crop&q=80',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600'
    }
  };

  const config = headerConfig[imageQuery] || {
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop&q=80',
    gradient: 'from-primary-500 via-primary-600 to-primary-700'
  };

  const currentImageUrl = customImage || config.image;

  // Upload manual de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande! Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setCustomImage(imageData);
        setImageLoaded(false);
        setImageError(false);
        localStorage.setItem(`pageHeader_${imageQuery}`, imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gerar imagem com IA
  const generateImageWithAI = async () => {
    setIsGenerating(true);
    
    try {
      const randomImages = [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&h=900&fit=crop&q=80'
      ];
      
      const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
      
      setCustomImage(randomImage);
      setImageLoaded(false);
      setImageError(false);
      localStorage.setItem(`pageHeader_${imageQuery}`, randomImage);
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Resetar para imagem padrão
  const resetToDefault = () => {
    setCustomImage(null);
    setImageLoaded(false);
    setImageError(false);
    localStorage.removeItem(`pageHeader_${imageQuery}`);
  };

  return (
    <div 
      className="relative h-48 md:h-56 overflow-hidden rounded-lg shadow-lg mb-6"
      onMouseEnter={() => setShowEditButton(true)}
      onMouseLeave={() => setShowEditButton(false)}
    >
      {/* ========== GRADIENTE DE FUNDO (SEMPRE VISÍVEL) ========== */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
      
      {/* ========== IMAGEM DE FUNDO (SE CARREGAR) ========== */}
      {!imageError && (
        <div className="absolute inset-0">
          <img
            src={currentImageUrl}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.warn('Erro ao carregar imagem:', currentImageUrl);
              setImageError(true);
              setImageLoaded(false);
            }}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-30' : 'opacity-0'
            }`}
          />
        </div>
      )}
      
      {/* Overlay Gradiente Escuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Padrão decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>
      
      {/* Botões de Edição */}
      {showEditButton && (
        <div className="absolute top-4 right-4 flex gap-2 z-20 animate-fade-in">
          {/* Upload Manual */}
          <label 
            className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-all shadow-lg group"
            title="Enviar imagem personalizada"
          >
            <PencilIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
            />
          </label>

          {/* Gerar com IA */}
          <button
            onClick={generateImageWithAI}
            disabled={isGenerating}
            className="bg-purple-500/80 hover:bg-purple-600/80 backdrop-blur-sm p-2 rounded-lg transition-all shadow-lg group disabled:opacity-50"
            title="Gerar nova imagem"
          >
            {isGenerating ? (
              <ArrowPathIcon className="w-5 h-5 text-white animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Resetar */}
          {customImage && (
            <button
              onClick={resetToDefault}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs font-medium transition-all shadow-lg hover:scale-105"
              title="Voltar ao padrão"
            >
              Padrão
            </button>
          )}
        </div>
      )}
      
      {/* Conteúdo */}
      <div className="relative h-full flex flex-col justify-end max-w-7xl mx-auto px-4 pb-6 pt-safe z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-5xl drop-shadow-2xl">{emoji}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/95 text-sm md:text-base drop-shadow-lg max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* Efeito de brilho superior */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none" />
    </div>
  );
}