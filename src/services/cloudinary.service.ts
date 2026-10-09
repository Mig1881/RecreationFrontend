const CLOUD_NAME = 'dy1etytro'; 
const UPLOAD_PRESET = 'recreacion_avatars'; 

export const cloudinaryService = {
  /**
   * Sube un archivo de imagen directamente a Cloudinary sin pasar por Spring Boot.
   * @param file Archivo binario de la imagen seleccionado por el usuario.
   * @returns La URL segura de internet (https://...) donde se ha alojado la foto.
   */
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('No se pudo subir la imagen al servidor de Cloudinary.');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error en Cloudinary Uploader:', error);
      throw error;
    }
  }
};