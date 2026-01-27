import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File) => {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
    };
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Erro na compressão:', error);
        return file; // Retorna o original se falhar
    }
};

export const getStoragePath = (bucket: string, userId: string, fileName: string) => {
    const timestamp = new Date().getTime();
    const cleanName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    return `${userId}/${timestamp}_${cleanName}`;
};
