import { useEffect } from 'react';

/**
 * Hook para cambiar el fondo del body dinámicamente y restaurarlo al desmontar.
 * @param imageUrl Ruta de la imagen de fondo.
 * @param title Opcional: Cambia el document.title mientras el componente está montado.
 */
const useBackgroundImage = (imageUrl: string, title?: string) => {
    useEffect(() => {
        const originalBg = document.body.style.backgroundImage;
        const originalRepeat = document.body.style.backgroundRepeat;
        const originalSize = document.body.style.backgroundSize;
        const originalAttachment = document.body.style.backgroundAttachment;
        const originalTitle = document.title;

        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        if (title) document.title = title;

        return () => {
            document.body.style.backgroundImage = originalBg;
            document.body.style.backgroundRepeat = originalRepeat;
            document.body.style.backgroundSize = originalSize;
            document.body.style.backgroundAttachment = originalAttachment;
            document.title = originalTitle;
        };
    }, [imageUrl, title]);
};

export default useBackgroundImage;
  