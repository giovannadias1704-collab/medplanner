import { useState, useEffect } from 'react';
import { PencilIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PageHeader({ title, subtitle, emoji, imageQuery }) {
  const [customImage, setCustomImage] = useState(null);
  const [showEditButton, setShowEditButton] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Carregar imagem personalizada do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`pageHeader_${imageQuery}`);
    if (saved) setCustomImage(saved);
  }, [imageQuery]);

  // Imagem padrão do Unsplash
  const unsplashUrl = `https://source.unsplash.com/1600x900/?${imageQuery},medical,clean`;

  // Determinar qual imagem usar
  const currentImageUrl = customImage || unsplashUrl;

  // Upload manual de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande! Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setCustomImage(imageData);
        localStorage.setItem(`pageHeader_${imageQuery}`, imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gerar imagem com IA
  const generateImageWithAI = async () => {
    setIsGenerating(true);
    
    try {
      // Nova imagem do Unsplash com timestamp para forçar refresh
      const specificUnsplashUrl = `https://source.unsplash.com/1600x900/?${imageQuery},healthcare,modern&sig=${Date.now()}`;
      
      setCustomImage(specificUnsplashUrl);
      localStorage.setItem(`pageHeader_${imageQuery}`, specificUnsplashUrl);
      
      // TODO: Quando integrar com API de geração real (Gemini, DALL-E, etc):
      // import { generateImage } from '../services/geminiAPI';
      // const imageUrl = await generateImage({ prompt: `medical ${imageQuery} professional`, ratio: '16:9' });
      // setCustomImage(imageUrl);
      // localStorage.setItem(`pageHeader_${imageQuery}`, imageUrl);
      
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
    localStorage.removeItem(`pageHeader_${imageQuery}`);
  };

  return (
    <div 
      className="relative h-48 md:h-56 overflow-hidden rounded-lg shadow-lg mb-6"
      onMouseEnter={() => setShowEditButton(true)}
      onMouseLeave={() => setShowEditButton(false)}
    >
      {/* Imagem de Fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
        style={{ 
          backgroundImage: `url(${currentImageUrl})`,
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Overlay Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      
      {/* Botões de Edição */}
      {showEditButton && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
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
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs font-medium transition-all shadow-lg"
              title="Voltar ao padrão"
            >
              Padrão
            </button>
          )}
        </div>
      )}
      
      {/* Conteúdo */}
      <div className="relative h-full flex flex-col justify-end max-w-7xl mx-auto px-4 pb-6 pt-safe">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-5xl drop-shadow-lg">{emoji}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/90 text-sm md:text-base drop-shadow-md">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}