export default function PageHeader({ title, subtitle, emoji, imageQuery }) {
  // Unsplash API - Imagens gratuitas e bonitas
  const imageUrl = `https://source.unsplash.com/1600x900/?${imageQuery}`;
  
  return (
    <div className="relative h-48 md:h-56 overflow-hidden">
      {/* Imagem de Fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${imageUrl})`,
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Overlay Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      
      {/* Conteúdo */}
      <div className="relative h-full flex flex-col justify-end max-w-7xl mx-auto px-4 pb-6 pt-safe">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-5xl drop-shadow-lg">{emoji}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-1">
          {title}
        </h1>
        <p className="text-white/90 text-sm md:text-base drop-shadow-md">
          {subtitle}
        </p>
      </div>
    </div>
  );
}